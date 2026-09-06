import request from "supertest";
import app from "../src/app";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

describe("Messages Module Endpoints", () => {
  let user1: any;
  let user2: any;
  let user3: any;
  let token1: string;
  let token2: string;
  let token3: string;
  let acceptedMatch: any;
  let pendingMatch: any;

  beforeAll(async () => {
    const existing = await prisma.user.findMany({ where: { email: { in: ["m1@test.com", "m2@test.com", "m3@test.com"] } } });
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

    user1 = await prisma.user.create({
      data: { email: "m1@test.com", passwordHash: "hash", name: "User One" },
    });
    user2 = await prisma.user.create({
      data: { email: "m2@test.com", passwordHash: "hash", name: "User Two" },
    });
    user3 = await prisma.user.create({
      data: { email: "m3@test.com", passwordHash: "hash", name: "User Three" },
    });

    token1 = jwt.sign({ userId: user1.id }, secret);
    token2 = jwt.sign({ userId: user2.id }, secret);
    token3 = jwt.sign({ userId: user3.id }, secret);

    acceptedMatch = await prisma.match.create({
      data: {
        requestedById: user1.id,
        requestedToId: user2.id,
        status: "ACCEPTED",
        matchScore: 1.0,
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
    const existing = await prisma.user.findMany({ where: { email: { in: ["m1@test.com", "m2@test.com", "m3@test.com"] } } });
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

  it("should persist message when participant sends message on ACCEPTED match", async () => {
    const res = await request(app)
      .post(`/api/v1/matches/${acceptedMatch.id}/messages`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ content: "Hello from User 1" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.content).toBe("Hello from User 1");
    expect(res.body.senderId).toBe(user1.id);
  });

  it("should reject message send on non-ACCEPTED (PENDING) match", async () => {
    const res = await request(app)
      .post(`/api/v1/matches/${pendingMatch.id}/messages`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ content: "Should fail" });

    expect(res.status).toBe(400);
    expect(res.body.error?.message || res.body.message).toMatch(/ACCEPTED/);
  });

  it("should block non-participants from sending or reading messages (403)", async () => {
    const postRes = await request(app)
      .post(`/api/v1/matches/${acceptedMatch.id}/messages`)
      .set("Authorization", `Bearer ${token3}`)
      .send({ content: "Unauthorized message" });

    expect(postRes.status).toBe(403);

    const getRes = await request(app)
      .get(`/api/v1/matches/${acceptedMatch.id}/messages`)
      .set("Authorization", `Bearer ${token3}`);

    expect(getRes.status).toBe(403);
  });

  it("should support correct pagination for message history", async () => {
    for (let i = 1; i <= 5; i++) {
      await prisma.message.create({
        data: {
          matchId: acceptedMatch.id,
          senderId: i % 2 === 0 ? user2.id : user1.id,
          content: `Test Message ${i}`,
        },
      });
    }

    const page1 = await request(app)
      .get(`/api/v1/matches/${acceptedMatch.id}/messages?limit=2&offset=0`)
      .set("Authorization", `Bearer ${token1}`);

    expect(page1.status).toBe(200);
    expect(page1.body.messages.length).toBe(2);
    expect(page1.body.limit).toBe(2);
    expect(page1.body.offset).toBe(0);
    expect(page1.body.total).toBeGreaterThanOrEqual(5);

    const page2 = await request(app)
      .get(`/api/v1/matches/${acceptedMatch.id}/messages?limit=2&offset=2`)
      .set("Authorization", `Bearer ${token1}`);

    expect(page2.status).toBe(200);
    expect(page2.body.messages.length).toBe(2);
    expect(page2.body.offset).toBe(2);
  });
});
