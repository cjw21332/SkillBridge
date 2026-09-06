import { bookingsRepository } from "./bookings.repository";
import { io } from "../../sockets";
import { notificationsService } from "../notifications/notifications.service";

export const bookingsService = {
  proposeBooking: async (
    userId: string,
    data: { matchId: string; skillId: string; scheduledAt: string; durationMin: number }
  ) => {
    const match = await bookingsRepository.findMatchById(data.matchId);

    if (!match) {
      throw { statusCode: 404, message: "Match not found" };
    }

    if (match.requestedById !== userId && match.requestedToId !== userId) {
      throw { statusCode: 403, message: "You are not a participant in this match" };
    }

    if (match.status !== "ACCEPTED") {
      throw { statusCode: 400, message: "Cannot propose bookings for a non-ACCEPTED match" };
    }

    const scheduledDate = new Date(data.scheduledAt);
    if (scheduledDate < new Date()) {
      throw { statusCode: 400, message: "scheduledAt must be in the future" };
    }

    const otherUserId = match.requestedById === userId ? match.requestedToId : match.requestedById;

    const userTeachSkills = await bookingsRepository.findUserTeachSkills(userId);
    const otherUserTeachSkills = await bookingsRepository.findUserTeachSkills(otherUserId);

    const isUserTeaching = userTeachSkills.some((s: any) => s.skillId === data.skillId);
    const isOtherTeaching = otherUserTeachSkills.some((s: any) => s.skillId === data.skillId);

    if (!isUserTeaching && !isOtherTeaching) {
      throw { statusCode: 400, message: "The chosen skill is not taught by either participant" };
    }

    const hostId = isUserTeaching ? userId : otherUserId;
    const guestId = isUserTeaching ? otherUserId : userId;

    const booking = await bookingsRepository.createBooking({
      matchId: data.matchId,
      hostId,
      guestId,
      proposedById: userId,
      skillId: data.skillId,
      scheduledAt: scheduledDate,
      durationMin: data.durationMin,
    });

    // Create notification for other participant
    await notificationsService.createNotification(otherUserId, "BOOKING_UPDATE", {
      bookingId: booking.id,
      matchId: data.matchId,
      status: "PROPOSED",
      scheduledAt: scheduledDate,
    });

    if (io) {
      io.to(match.requestedById).to(match.requestedToId).emit("booking:update", booking);
    }

    return booking;
  },

  updateBookingStatus: async (userId: string, bookingId: string, status: string) => {
    const booking = await bookingsRepository.findBookingById(bookingId);

    if (!booking) {
      throw { statusCode: 404, message: "Booking not found" };
    }

    if (booking.hostId !== userId && booking.guestId !== userId) {
      throw { statusCode: 403, message: "You are not a participant in this booking" };
    }

    const scheduledDate = new Date(booking.scheduledAt);

    if (status === "CONFIRMED" || status === "DECLINED") {
      if (booking.proposedById && booking.proposedById === userId) {
        throw { statusCode: 403, message: "Only the recipient can confirm or decline this proposed session" };
      }
    }

    if (status === "CONFIRMED") {
      if (booking.status !== "PROPOSED") {
        throw { statusCode: 400, message: "Only PROPOSED bookings can be CONFIRMED" };
      }
      if (scheduledDate < new Date()) {
        throw { statusCode: 400, message: "Cannot confirm a booking that is already in the past" };
      }
    }

    if (status === "CANCELLED") {
      if (booking.status !== "CONFIRMED") {
        throw { statusCode: 400, message: "Only CONFIRMED bookings can be CANCELLED" };
      }
      
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      if (scheduledDate < oneHourFromNow) {
        throw { statusCode: 400, message: "Cannot cancel a booking within 1 hour of the scheduled time" };
      }
    }

    if (status === "DECLINED") {
      if (booking.status !== "PROPOSED") {
        throw { statusCode: 400, message: "Only PROPOSED bookings can be DECLINED" };
      }
    }

    const updatedBooking = await bookingsRepository.updateBookingStatus(bookingId, status);

    const otherUserId = booking.hostId === userId ? booking.guestId : booking.hostId;
    await notificationsService.createNotification(otherUserId, "BOOKING_UPDATE", {
      bookingId,
      status,
      scheduledAt: booking.scheduledAt,
    });

    if (io) {
      io.to(booking.hostId).to(booking.guestId).emit("booking:update", updatedBooking);
    }

    return updatedBooking;
  },

  getBookings: async (userId: string, filters: { status?: string; when?: string }) => {
    return bookingsRepository.findBookingsForUser(userId, filters);
  },
};
