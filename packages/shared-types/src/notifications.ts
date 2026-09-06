import { z } from "zod";

export const NotificationTypeSchema = z.enum(["NEW_MATCH", "NEW_MESSAGE", "BOOKING_UPDATE", "NEW_REVIEW"]);

export const GetNotificationsQuerySchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
});
