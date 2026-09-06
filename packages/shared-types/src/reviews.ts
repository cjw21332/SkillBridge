import { z } from "zod";

export const CreateReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  comment: z.string().max(1000, "Comment cannot exceed 1000 characters").optional(),
});

export const GetReviewsQuerySchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
});
