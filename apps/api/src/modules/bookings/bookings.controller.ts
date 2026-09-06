import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { bookingsService } from "./bookings.service";

export const bookingsController = {
  proposeBooking: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const booking = await bookingsService.proposeBooking(userId, req.body);
      res.status(201).json(booking);
    } catch (err) {
      next(err);
    }
  },

  updateBookingStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const bookingId = req.params.id;
      const { status } = req.body;

      const booking = await bookingsService.updateBookingStatus(userId, bookingId, status);
      res.json(booking);
    } catch (err) {
      next(err);
    }
  },

  getBookings: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { status, when } = req.query as { status?: string; when?: string };
      const bookings = await bookingsService.getBookings(userId, { status, when });
      res.json(bookings);
    } catch (err) {
      next(err);
    }
  },
};
