import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const reviewsRepository = {
  findBookingById: (bookingId: string) =>
    prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        host: { select: { id: true, name: true, email: true, avatarUrl: true } },
        guest: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    }),

  findReviewByBookingAndAuthor: (bookingId: string, authorId: string) =>
    prisma.review.findUnique({
      where: {
        bookingId_authorId: {
          bookingId,
          authorId,
        },
      },
    }),

  createReview: (data: {
    bookingId: string;
    authorId: string;
    targetId: string;
    rating: number;
    comment?: string;
  }) =>
    prisma.review.create({
      data,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        target: { select: { id: true, name: true, avatarUrl: true } },
        booking: true,
      },
    }),

  getReviewsForUser: async (targetId: string, limit = 10, offset = 0) => {
    const [reviews, total, aggregate] = await Promise.all([
      prisma.review.findMany({
        where: { targetId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          booking: {
            include: {
              match: true,
            },
          },
        },
      }),
      prisma.review.count({ where: { targetId } }),
      prisma.review.aggregate({
        where: { targetId },
        _avg: { rating: true },
      }),
    ]);

    const averageRating = aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(2)) : 0;

    return {
      reviews,
      total,
      averageRating,
      limit,
      offset,
    };
  },
};
