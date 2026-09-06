import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { createClient } from "redis";

const client = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
client.connect().catch(console.error);

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: () => process.env.NODE_ENV === "test",
  store: new RedisStore({ sendCommand: (...args: string[]) => client.sendCommand(args) }),
  message: { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many attempts" } }
});

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  skip: () => process.env.NODE_ENV === "test",
  store: new RedisStore({ sendCommand: (...args: string[]) => client.sendCommand(args) }),
  message: { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests" } }
});

export const writesRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  skip: () => process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development",
  store: new RedisStore({ sendCommand: (...args: string[]) => client.sendCommand(args) }),
  message: { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many write operations" } }
});
