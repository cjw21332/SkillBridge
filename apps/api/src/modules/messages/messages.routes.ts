import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { messagesController } from "./messages.controller";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/", messagesController.getMessages);
router.post("/", messagesController.sendMessage);
router.patch("/read", messagesController.markAsRead);

export default router;
