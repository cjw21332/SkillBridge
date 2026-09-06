import { Router } from "express";
import { skillsController } from "./skills.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
router.get("/", skillsController.search);
router.post("/", authMiddleware, skillsController.create);

export default router;
