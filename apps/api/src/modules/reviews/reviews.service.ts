import { reviewsRepository } from "./reviews.repository";
import { notificationsService } from "../notifications/notifications.service";

export const reviewsService = {
  createReview: async (
    bookingId: string,
    authorId: string,
    rating: number,
    comment?: string
  ) => {
    const booking = await reviewsRepository.findBookingById(bookingId);
    if (!booking) {
      const error: any = new Error("Booking not found");
      error.statusCode = 404;
      throw error;
    }

    if (booking.status !== "COMPLETED") {
      const error: any = new Error("Reviews can only be submitted for COMPLETED bookings");
      error.statusCode = 400;
      throw error;
    }

    if (booking.hostId !== authorId && booking.guestId !== authorId) {
      const error: any = new Error("You are not a participant in this booking");
      error.statusCode = 403;
      throw error;
    }

    const existing = await reviewsRepository.findReviewByBookingAndAuthor(bookingId, authorId);
    if (existing) {
      const error: any = new Error("You have already reviewed this booking");
      error.statusCode = 400;
      throw error;
    }

    const targetId = booking.hostId === authorId ? booking.guestId : booking.hostId;

    const review = await reviewsRepository.createReview({
      bookingId,
      authorId,
      targetId,
      rating,
      comment,
    });

    // Create persistent notification and emit socket event for the reviewed user
    await notificationsService.createNotification(targetId, "NEW_REVIEW", {
      bookingId,
      reviewId: review.id,
      rating,
      authorName: review.author.name,
      comment,
    });

    return review;
  },

  getUserReviews: (targetId: string, limit = 10, offset = 0) =>
    reviewsRepository.getReviewsForUser(targetId, limit, offset),
};
