import { createClient } from "redis";
import { logger } from "./logger";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
export const cacheClient = createClient({ url: redisUrl });

cacheClient.connect().catch((err) => {
  logger.warn({ err: err.message }, "Redis cache client connection deferred");
});

export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    if (!cacheClient.isOpen) return null;
    const data = await cacheClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err: any) {
    logger.warn({ key, err: err.message }, "Cache read failure");
    return null;
  }
};

export const setCache = async (key: string, value: any, ttlSeconds = 300): Promise<void> => {
  try {
    if (!cacheClient.isOpen) return;
    await cacheClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err: any) {
    logger.warn({ key, err: err.message }, "Cache write failure");
  }
};

export const invalidateCachePattern = async (pattern: string): Promise<void> => {
  try {
    if (!cacheClient.isOpen) return;
    const keys = await cacheClient.keys(pattern);
    if (keys.length > 0) {
      await cacheClient.del(keys);
    }
  } catch (err: any) {
    logger.warn({ pattern, err: err.message }, "Cache invalidation failure");
  }
};