import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { messagesService } from "./messages.service";
import { SendMessageSchema, GetMessagesQuerySchema } from "@skillbridge/shared-types";

export const messagesController = {
  getMessages: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const matchId = req.params.matchId;
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await messagesService.getMessages(matchId, userId, limit, offset);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  sendMessage: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const matchId = req.params.matchId;
      const senderId = req.user!.id;
      const { content } = SendMessageSchema.parse(req.body);

      const message = await messagesService.sendMessage(matchId, senderId, content);
      res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  },

  markAsRead: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const matchId = req.params.matchId;
      const userId = req.user!.id;

      await messagesService.markAsRead(matchId, userId);
      res.json({ status: "ok" });
    } catch (err) {
      next(err);
    }
  },
};
