import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { notificationsController } from "./notifications.controller";

const router = Router();

router.use(authenticate);

router.get("/", notificationsController.getNotifications);
router.patch("/read-all", notificationsController.markAllAsRead);
router.patch("/:id/read", notificationsController.markAsRead);

export default router;
