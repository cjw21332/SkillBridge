import request from "supertest";
import app from "../src/app";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Auth Module", () => {
  beforeAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: "authtest@example.com" } });
    if (user) {
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.notification.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: "authtest@example.com" } });
    if (user) {
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.notification.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  it("should register a new user successfully", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "authtest@example.com", password: "password123", name: "Auth Tester" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.user.email).toBe("authtest@example.com");
  });

  it("should reject login with wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "authtest@example.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
  });
});
