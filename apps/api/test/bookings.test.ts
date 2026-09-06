import request from "supertest";
import app from "../src/app";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { completeExpiredBookings } from "../src/jobs/bookingAutoComplete.job";

const prisma = new PrismaClient();

describe("Bookings Module Endpoints & Auto-Complete Job", () => {
  let user1: any;
  let user2: any;
  let user3: any;
  let token1: string;
  let token2: string;
  let token3: string;
  let skill1: any;
  let skill2: any;
  let acceptedMatch: any;
  let pendingMatch: any;

  beforeAll(async () => {
    const existing = await prisma.user.findMany({
      where: { email: { in: ["b1@test.com", "b2@test.com", "b3@test.com"] } },
    });
    const ids = existing.map((u) => u.id);
    if (ids.length) {
      await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
      await prisma.review.deleteMany({ where: { OR: [{ authorId: { in: ids } }, { targetId: { in: ids } }] } });
      await prisma.booking.deleteMany({
        where: { OR: [{ hostId: { in: ids } }, { guestId: { in: ids } }] },
      });
      await prisma.message.deleteMany({ where: { senderId: { in: ids } } });
      await prisma.userSkill.deleteMany({ where: { userId: { in: ids } } });
      await prisma.match.deleteMany({
        where: { OR: [{ requestedById: { in: ids } }, { requestedToId: { in: ids } }] },
      });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }

    const secret = process.env.JWT_SECRET || "supersecret123";

    user1 = await prisma.user.create({
      data: { email: "b1@test.com", passwordHash: "hash", name: "Host User" },
    });
    user2 = await prisma.user.create({
      data: { email: "b2@test.com", passwordHash: "hash", name: "Guest User" },
    });
    user3 = await prisma.user.create({
      data: { email: "b3@test.com", passwordHash: "hash", name: "Third User" },
    });

    token1 = jwt.sign({ userId: user1.id }, secret);
    token2 = jwt.sign({ userId: user2.id }, secret);
    token3 = jwt.sign({ userId: user3.id }, secret);

    skill1 = await prisma.skill.upsert({
      where: { name: "BookingSkill-1" },
      update: {},
      create: { name: "BookingSkill-1", category: "Tech" },
    });
    skill2 = await prisma.skill.upsert({
      where: { name: "BookingSkill-2" },
      update: {},
      create: { name: "BookingSkill-2", category: "Design" },
    });

    await prisma.userSkill.create({
      data: {
        userId: user1.id,
        skillId: skill1.id,
        type: "TEACH",
        level: 5,
      },
    });

    acceptedMatch = await prisma.match.create({
      data: {
        requestedById: user1.id,
        requestedToId: user2.id,
        status: "ACCEPTED",
        matchScore: 0.9,
      },
    });

    pendingMatch = await prisma.match.create({
      data: {
        requestedById: user1.id,
        requestedToId: user3.id,
        status: "PENDING",
        matchScore: 0.8,
      },
    });
  });

  afterAll(async () => {
    const existing = await prisma.user.findMany({
      where: { email: { in: ["b1@test.com", "b2@test.com", "b3@test.com"] } },
    });
    const ids = existing.map((u) => u.id);
    if (ids.length) {
      await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
      await prisma.review.deleteMany({ where: { OR: [{ authorId: { in: ids } }, { targetId: { in: ids } }] } });
      await prisma.booking.deleteMany({
        where: { OR: [{ hostId: { in: ids } }, { guestId: { in: ids } }] },
      });
      await prisma.message.deleteMany({ where: { senderId: { in: ids } } });
      await prisma.userSkill.deleteMany({ where: { userId: { in: ids } } });
      await prisma.match.deleteMany({
        where: { OR: [{ requestedById: { in: ids } }, { requestedToId: { in: ids } }] },
      });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  it("should create a valid PROPOSED booking for a skill taught by host", async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${token2}`)
      .send({
        matchId: acceptedMatch.id,
        skillId: skill1.id,
        scheduledAt: futureDate,
        durationMin: 60,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PROPOSED");
    expect(res.body.hostId).toBe(user1.id);
    expect(res.body.guestId).toBe(user2.id);
  });

  it("should reject booking for a skill not taught by either participant", async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        matchId: acceptedMatch.id,
        skillId: skill2.id,
        scheduledAt: futureDate,
        durationMin: 60,
      });

    expect(res.status).toBe(400);
    expect(res.body.error?.message).toMatch(/not taught by either participant/);
  });

  it("should reject bookings on non-ACCEPTED (PENDING) matches", async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        matchId: pendingMatch.id,
        skillId: skill1.id,
        scheduledAt: futureDate,
        durationMin: 60,
      });

    expect(res.status).toBe(400);
    expect(res.body.error?.message).toMatch(/non-ACCEPTED/);
  });

  it("should enforce confirm/decline/cancel authorization and 1-hour cancellation cutoff", async () => {
    const farFutureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const b1 = await prisma.booking.create({
      data: {
        matchId: acceptedMatch.id,
        hostId: user1.id,
        guestId: user2.id,
        skillId: skill1.id,
        scheduledAt: farFutureDate,
        durationMin: 60,
        status: "PROPOSED",
      },
    });

    const forbiddenRes = await request(app)
      .patch(`/api/v1/bookings/${b1.id}`)
      .set("Authorization", `Bearer ${token3}`)
      .send({ status: "CONFIRMED" });
    expect(forbiddenRes.status).toBe(403);

    const confirmRes = await request(app)
      .patch(`/api/v1/bookings/${b1.id}`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ status: "CONFIRMED" });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.status).toBe("CONFIRMED");

    const cancelRes = await request(app)
      .patch(`/api/v1/bookings/${b1.id}`)
      .set("Authorization", `Bearer ${token2}`)
      .send({ status: "CANCELLED" });
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.status).toBe("CANCELLED");

    // 2. Cutoff boundary: 59 mins from now (inside cutoff -> 400)
    const b2 = await prisma.booking.create({
      data: {
        matchId: acceptedMatch.id,
        hostId: user1.id,
        guestId: user2.id,
        skillId: skill1.id,
        scheduledAt: new Date(Date.now() + 59 * 60 * 1000),
        durationMin: 60,
        status: "CONFIRMED",
      },
    });

    const cutoffRes = await request(app)
      .patch(`/api/v1/bookings/${b2.id}`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ status: "CANCELLED" });
    expect(cutoffRes.status).toBe(400);
    expect(cutoffRes.body.error?.message).toMatch(/1 hour/);

    // 3. Cutoff boundary: 65 mins from now (outside cutoff -> 200)
    const b3 = await prisma.booking.create({
      data: {
        matchId: acceptedMatch.id,
        hostId: user1.id,
        guestId: user2.id,
        skillId: skill1.id,
        scheduledAt: new Date(Date.now() + 65 * 60 * 1000),
        durationMin: 60,
        status: "CONFIRMED",
      },
    });

    const cancelAllowedRes = await request(app)
      .patch(`/api/v1/bookings/${b3.id}`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ status: "CANCELLED" });
    expect(cancelAllowedRes.status).toBe(200);
    expect(cancelAllowedRes.body.status).toBe("CANCELLED");

    // 4. Non-participant tries to cancel -> 403
    const b4 = await prisma.booking.create({
      data: {
        matchId: acceptedMatch.id,
        hostId: user1.id,
        guestId: user2.id,
        skillId: skill1.id,
        scheduledAt: new Date(Date.now() + 120 * 60 * 1000),
        durationMin: 60,
        status: "CONFIRMED",
      },
    });
    const nonPartCancelRes = await request(app)
      .patch(`/api/v1/bookings/${b4.id}`)
      .set("Authorization", `Bearer ${token3}`)
      .send({ status: "CANCELLED" });
    expect(nonPartCancelRes.status).toBe(403);
  });

  it("should flip CONFIRMED bookings past end time to COMPLETED status, but ignore PROPOSED or DECLINED", async () => {
    const pastStart = new Date(Date.now() - 120 * 60 * 1000);
    const pastConfirmedBooking = await prisma.booking.create({
      data: {
        matchId: acceptedMatch.id,
        hostId: user1.id,
        guestId: user2.id,
        skillId: skill1.id,
        scheduledAt: pastStart,
        durationMin: 60,
        status: "CONFIRMED",
      },
    });

    const pastProposedBooking = await prisma.booking.create({
      data: {
        matchId: acceptedMatch.id,
        hostId: user1.id,
        guestId: user2.id,
        skillId: skill1.id,
        scheduledAt: pastStart,
        durationMin: 60,
        status: "PROPOSED",
      },
    });

    const pastDeclinedBooking = await prisma.booking.create({
      data: {
        matchId: acceptedMatch.id,
        hostId: user1.id,
        guestId: user2.id,
        skillId: skill1.id,
        scheduledAt: pastStart,
        durationMin: 60,
        status: "DECLINED",
      },
    });

    const completed = await completeExpiredBookings();
    expect(completed.some((b) => b.id === pastConfirmedBooking.id)).toBe(true);

    const checkConfirmed = await prisma.booking.findUnique({
      where: { id: pastConfirmedBooking.id },
    });
    expect(checkConfirmed?.status).toBe("COMPLETED");

    const checkProposed = await prisma.booking.findUnique({
      where: { id: pastProposedBooking.id },
    });
    expect(checkProposed?.status).toBe("PROPOSED");

    const checkDeclined = await prisma.booking.findUnique({
      where: { id: pastDeclinedBooking.id },
    });
    expect(checkDeclined?.status).toBe("DECLINED");
  });
});
