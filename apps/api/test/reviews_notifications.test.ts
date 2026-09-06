import request from "supertest";
import app from "../src/app";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

describe("Reviews & Notifications Modules", () => {
  let user1: any;
  let user2: any;
  let user3: any;
  let token1: string;
  let token2: string;
  let token3: string;
  let skill1: any;
  let acceptedMatch: any;
  let completedBooking: any;
  let confirmedBooking: any;

  beforeAll(async () => {
    const existing = await prisma.user.findMany({
      where: { email: { in: ["rn1@test.com", "rn2@test.com", "rn3@test.com"] } },
    });
    const ids = existing.map((u) => u.id);
    if (ids.length) {
      await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
      await prisma.review.deleteMany({ where: { OR: [{ authorId: { in: ids } }, { targetId: { in: ids } }] } });
      await prisma.booking.deleteMany({ where: { OR: [{ hostId: { in: ids } }, { guestId: { in: ids } }] } });
      await prisma.message.deleteMany({ where: { senderId: { in: ids } } });
      await prisma.userSkill.deleteMany({ where: { userId: { in: ids } } });
      await prisma.match.deleteMany({ where: { OR: [{ requestedById: { in: ids } }, { requestedToId: { in: ids } }] } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }

    const secret = process.env.JWT_SECRET || "supersecret123";

    user1 = await prisma.user.create({ data: { email: "rn1@test.com", passwordHash: "hash", name: "Reviewer User" } });
    user2 = await prisma.user.create({ data: { email: "rn2@test.com", passwordHash: "hash", name: "Target User" } });
    user3 = await prisma.user.create({ data: { email: "rn3@test.com", passwordHash: "hash", name: "Outsider User" } });

    token1 = jwt.sign({ userId: user1.id }, secret);
    token2 = jwt.sign({ userId: user2.id }, secret);
    token3 = jwt.sign({ userId: user3.id }, secret);

    skill1 = await prisma.skill.upsert({
      where: { name: "ReviewSkill-1" },
      update: {},
      create: { name: "ReviewSkill-1", category: "Tech" },
    });

    await prisma.userSkill.create({
      data: { userId: user2.id, skillId: skill1.id, type: "TEACH", level: 5 },
    });

    acceptedMatch = await prisma.match.create({
      data: { requestedById: user1.id, requestedToId: user2.id, status: "ACCEPTED", matchScore: 1.0 },
    });

    completedBooking = await prisma.booking.create({
      data: {
        matchId: acceptedMatch.id,
        hostId: user2.id,
        guestId: user1.id,
        skillId: skill1.id,
        scheduledAt: new Date(Date.now() - 3600000),
        durationMin: 60,
        status: "COMPLETED",
      },
    });

    confirmedBooking = await prisma.booking.create({
      data: {
        matchId: acceptedMatch.id,
        hostId: user2.id,
        guestId: user1.id,
        skillId: skill1.id,
        scheduledAt: new Date(Date.now() + 3600000),
        durationMin: 60,
        status: "CONFIRMED",
      },
    });
  });

  afterAll(async () => {
    const existing = await prisma.user.findMany({
      where: { email: { in: ["rn1@test.com", "rn2@test.com", "rn3@test.com"] } },
    });
    const ids = existing.map((u) => u.id);
    if (ids.length) {
      await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
      await prisma.review.deleteMany({ where: { OR: [{ authorId: { in: ids } }, { targetId: { in: ids } }] } });
      await prisma.booking.deleteMany({ where: { OR: [{ hostId: { in: ids } }, { guestId: { in: ids } }] } });
      await prisma.message.deleteMany({ where: { senderId: { in: ids } } });
      await prisma.userSkill.deleteMany({ where: { userId: { in: ids } } });
      await prisma.match.deleteMany({ where: { OR: [{ requestedById: { in: ids } }, { requestedToId: { in: ids } }] } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  describe("Reviews Module", () => {
    it("should reject review submission if booking is not COMPLETED", async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${confirmedBooking.id}/review`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ rating: 5, comment: "Too early" });

      expect(res.status).toBe(400);
      expect(res.body.error?.message).toMatch(/COMPLETED/);
    });

    it("should block non-participants from reviewing a booking (403)", async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${completedBooking.id}/review`)
        .set("Authorization", `Bearer ${token3}`)
        .send({ rating: 5, comment: "I was not in this session" });

      expect(res.status).toBe(403);
    });

    it("should successfully submit review for COMPLETED booking and notify target user", async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${completedBooking.id}/review`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ rating: 5, comment: "Amazing teaching session!" });

      expect(res.status).toBe(201);
      expect(res.body.rating).toBe(5);
      expect(res.body.targetId).toBe(user2.id);

      const notifRes = await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${token2}`);
      expect(notifRes.status).toBe(200);
      expect(notifRes.body.notifications.some((n: any) => n.type === "NEW_REVIEW")).toBe(true);
    });

    it("should reject duplicate review for the same booking by the same author", async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${completedBooking.id}/review`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ rating: 4, comment: "Second attempt" });

      expect(res.status).toBe(400);
      expect(res.body.error?.message).toMatch(/already reviewed/);
    });

    it("should accurately compute average rating on public user reviews endpoint", async () => {
      const booking2 = await prisma.booking.create({
        data: {
          matchId: acceptedMatch.id,
          hostId: user2.id,
          guestId: user1.id,
          skillId: skill1.id,
          scheduledAt: new Date(Date.now() - 7200000),
          durationMin: 60,
          status: "COMPLETED",
        },
      });

      await prisma.review.create({
        data: {
          bookingId: booking2.id,
          authorId: user1.id,
          targetId: user2.id,
          rating: 3,
          comment: "Decent session",
        },
      });

      const res = await request(app).get(`/api/v1/users/${user2.id}/reviews`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.averageRating).toBe(4.0);
      expect(res.body.reviews.length).toBe(2);
    });
  });

  describe("Notifications Module", () => {
    it("should list paginated notifications and allow marking as read", async () => {
      const listRes = await request(app)
        .get("/api/v1/notifications?limit=10&offset=0")
        .set("Authorization", `Bearer ${token2}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.notifications.length).toBeGreaterThan(0);
      const notifId = listRes.body.notifications[0].id;

      const readRes = await request(app)
        .patch(`/api/v1/notifications/${notifId}/read`)
        .set("Authorization", `Bearer ${token2}`);

      expect(readRes.status).toBe(200);
      expect(readRes.body.status).toBe("ok");
    });
  });
});
