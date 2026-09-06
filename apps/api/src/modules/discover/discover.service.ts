import { PrismaClient } from "@prisma/client";
import { computeMatchScore } from "../../utils/matchScore";
import { getCache, setCache } from "../../utils/redisCache";

const prisma = new PrismaClient();

const userWithSkills = {
  teachSkills: { where: { type: "TEACH" as const }, include: { skill: true } },
  learnSkills: { where: { type: "LEARN" as const }, include: { skill: true } },
  availability: true,
} as const;

export const discoverService = {
  getCandidates: async (userId: string) => {
    const cacheKey = `discover:candidates:${userId}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) return cached;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: userWithSkills,
    });

    if (!user) return [];

    // Exclude people the current user already has a match relationship with
    const existingMatches = await prisma.match.findMany({
      where: { OR: [{ requestedById: userId }, { requestedToId: userId }] },
      select: { requestedById: true, requestedToId: true },
    });
    const excludeIds = new Set<string>([userId]);
    for (const m of existingMatches) {
      excludeIds.add(m.requestedById);
      excludeIds.add(m.requestedToId);
    }

    const candidates = await prisma.user.findMany({
      where: { id: { notIn: [...excludeIds] } },
      include: userWithSkills,
    });

    const scored = candidates
      .map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        bio: candidate.bio,
        location: candidate.location,
        avatarUrl: candidate.avatarUrl,
        isVerified: candidate.isVerified,
        teachSkills: candidate.teachSkills,
        learnSkills: candidate.learnSkills,
        matchScore: computeMatchScore(user, candidate),
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20);

    await setCache(cacheKey, scored, 60); // 1-minute TTL for recommendation candidates

    return scored;
  },
};