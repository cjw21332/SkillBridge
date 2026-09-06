import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const bookingsRepository = {
  findMatchById: (matchId: string) =>
    prisma.match.findUnique({
      where: { id: matchId },
      include: {
        requestedBy: {
          select: { id: true, name: true, avatarUrl: true },
          include: undefined,
        },
        requestedTo: {
          select: { id: true, name: true, avatarUrl: true },
          include: undefined,
        },
      },
    }),

  findUserTeachSkills: (userId: string) =>
    prisma.userSkill.findMany({
      where: { userId, type: "TEACH" },
      include: { skill: true },
    }),

  createBooking: (data: {
    matchId: string;
    hostId: string;
    guestId: string;
    proposedById?: string;
    skillId: string;
    scheduledAt: Date;
    durationMin: number;
  }) =>
    prisma.booking.create({
      data,
      include: {
        host: { select: { id: true, name: true, avatarUrl: true } },
        guest: { select: { id: true, name: true, avatarUrl: true } },
        match: true,
      },
    }),

  findBookingById: (id: string) =>
    prisma.booking.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true } },
        guest: { select: { id: true, name: true, avatarUrl: true } },
        match: true,
      },
    }),

  updateBookingStatus: (id: string, status: string) =>
    prisma.booking.update({
      where: { id },
      data: { status: status as any },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true } },
        guest: { select: { id: true, name: true, avatarUrl: true } },
        match: true,
      },
    }),

  findBookingsForUser: (userId: string, filters: { status?: string; when?: string }) => {
    const where: any = {
      OR: [{ hostId: userId }, { guestId: userId }],
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.when === "upcoming") {
      where.scheduledAt = { gte: new Date() };
    } else if (filters.when === "past") {
      where.scheduledAt = { lt: new Date() };
    }

    return prisma.booking.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true } },
        guest: { select: { id: true, name: true, avatarUrl: true } },
        match: true,
      },
    });
  },

  findConfirmedBookingsToComplete: () =>
    prisma.booking.findMany({
      where: { status: "CONFIRMED" },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true } },
        guest: { select: { id: true, name: true, avatarUrl: true } },
        match: true,
      },
    }),

  bulkUpdateStatus: (ids: string[], status: string) =>
    prisma.booking.updateMany({
      where: { id: { in: ids } },
      data: { status: status as any },
    }),
};
