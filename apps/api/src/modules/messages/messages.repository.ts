import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const messagesRepository = {
  findMatchById: (matchId: string) =>
    prisma.match.findUnique({
      where: { id: matchId },
      include: {
        requestedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        requestedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    }),

  getMessages: async (matchId: string, limit = 20, offset = 0) => {
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { matchId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      prisma.message.count({ where: { matchId } }),
    ]);

    return { messages, total, limit, offset };
  },

  createMessage: (matchId: string, senderId: string, content: string) =>
    prisma.message.create({
      data: {
        matchId,
        senderId,
        content,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
    }),

  markAsRead: (matchId: string, userId: string) =>
    prisma.message.updateMany({
      where: {
        matchId,
        senderId: { not: userId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    }),
};
