import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const notificationsRepository = {
  createNotification: (userId: string, type: string, payload: any) =>
    prisma.notification.create({
      data: {
        userId,
        type,
        payload,
      },
    }),

  getUserNotifications: async (userId: string, limit = 20, offset = 0) => {
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      limit,
      offset,
    };
  },

  markAsRead: (id: string, userId: string) =>
    prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    }),

  markAllAsRead: (userId: string) =>
    prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    }),

  findUserEmail: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    return user;
  },
};
