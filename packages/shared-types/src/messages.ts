import { z } from "zod";

export const SendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
});

export const GetMessagesQuerySchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
  cursor: z.string().optional(),
});
