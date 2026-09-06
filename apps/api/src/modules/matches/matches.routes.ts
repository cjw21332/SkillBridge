import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { matchesController } from "./matches.controller";
import messagesRoutes from "../messages/messages.routes";

const router = Router();

router.use(authenticate);

router.get("/", matchesController.getMatches);
router.post("/", matchesController.requestMatch);
router.patch("/:id", matchesController.updateMatchStatus);

// Mount nested messages routes under /matches/:matchId/messages
router.use("/:matchId/messages", messagesRoutes);

export default router;
