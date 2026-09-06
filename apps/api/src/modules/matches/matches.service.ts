import { PrismaClient } from "@prisma/client";
import { io } from "../../sockets";
import { notificationsService } from "../notifications/notifications.service";
import { computeMatchScore } from "../../utils/matchScore";

const prisma = new PrismaClient();

const userWithSkills = {
  teachSkills: { where: { type: "TEACH" as const }, include: { skill: true } },
  learnSkills: { where: { type: "LEARN" as const }, include: { skill: true } },
  availability: true,
} as const;

export const matchesService = {
  requestMatch: async (requestedById: string, requestedToId: string) => {
    const [requester, candidate] = await Promise.all([
      prisma.user.findUnique({ where: { id: requestedById }, include: userWithSkills }),
      prisma.user.findUnique({ where: { id: requestedToId }, include: userWithSkills }),
    ]);

    const matchScore = requester && candidate ? computeMatchScore(requester, candidate) : 0;

    const match = await prisma.match.create({
      data: { requestedById, requestedToId, matchScore },
      include: {
        requestedBy: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Create persistent notification for target user
    await notificationsService.createNotification(requestedToId, "NEW_MATCH", {
      matchId: match.id,
      requesterId: requestedById,
      requesterName: match.requestedBy.name,
    });

    if (io) {
      io.to(requestedToId).emit("match:new", match);
    }

    return match;
  },

  acceptMatch: async (id: string, userId: string) => {
    const match = await prisma.match.update({
      where: { id, requestedToId: userId },
      data: { status: "ACCEPTED" },
      include: {
        requestedBy: { select: { id: true, name: true, avatarUrl: true } },
        requestedTo: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    await notificationsService.createNotification(match.requestedById, "NEW_MATCH", {
      matchId: match.id,
      status: "ACCEPTED",
      accepterName: match.requestedTo.name,
    });

    if (io) {
      io.to(match.requestedById).to(match.requestedToId).emit("match:new", match);
    }

    return match;
  },
};
