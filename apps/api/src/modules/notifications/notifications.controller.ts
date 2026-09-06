import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { notificationsService } from "./notifications.service";

export const notificationsController = {
  getNotifications: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await notificationsService.getNotifications(userId, limit, offset);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  markAsRead: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await notificationsService.markAsRead(id, userId);
      res.json({ status: "ok" });
    } catch (err) {
      next(err);
    }
  },

  markAllAsRead: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      await notificationsService.markAllAsRead(userId);
      res.json({ status: "ok" });
    } catch (err) {
      next(err);
    }
  },
};
