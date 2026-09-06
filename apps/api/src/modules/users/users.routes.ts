import { Router } from "express";
import { usersController } from "./users.controller";
import { reviewsController } from "../reviews/reviews.controller";
import { usersWallController } from "./users.wall.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
router.get("/me", authMiddleware, usersController.getMe);
router.post("/me/upload-signature", authMiddleware, usersController.getUploadSignature);
router.patch("/me", authMiddleware, usersController.updateMe);
router.put("/me/skills", authMiddleware, usersController.updateMeSkills);
router.put("/me/availability", authMiddleware, usersController.updateMeAvailability);
router.get("/:id/reviews", reviewsController.getUserReviews);
router.get("/:id/wall", authMiddleware, usersWallController.getProfileWall);
router.post("/:id/wall/comments", authMiddleware, usersWallController.postWallComment);
router.post("/:id/wall/like", authMiddleware, usersWallController.toggleProfileLike);
router.get("/:id", authMiddleware, usersController.getPublicProfile);

export default router;
