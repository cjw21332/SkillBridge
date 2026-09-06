import { z } from "zod";

export const ProposeBookingSchema = z.object({
  matchId: z.string().uuid(),
  skillId: z.string().uuid(),
  scheduledAt: z.string().datetime({ message: "scheduledAt must be a valid ISO datetime" }),
  durationMin: z.number().int().min(15).max(480).default(60),
});

export const UpdateBookingSchema = z.object({
  status: z.enum(["CONFIRMED", "DECLINED", "CANCELLED"]),
});
