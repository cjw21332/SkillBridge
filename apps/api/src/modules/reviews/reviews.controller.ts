import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { reviewsService } from "./reviews.service";
import { CreateReviewSchema } from "@skillbridge/shared-types";

export const reviewsController = {
  createReview: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const bookingId = req.params.id;
      const authorId = req.user!.id;
      const { rating, comment } = CreateReviewSchema.parse(req.body);

      const review = await reviewsService.createReview(bookingId, authorId, rating, comment);
      res.status(201).json(review);
    } catch (err) {
      next(err);
    }
  },

  getUserReviews: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetId = req.params.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await reviewsService.getUserReviews(targetId, limit, offset);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
