import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { postsController } from "./posts.controller";

const router = Router();

router.use(authenticate);

router.get("/feed", postsController.getFeed);
router.get("/user/:userId", postsController.getUserPosts);
router.post("/", postsController.createPost);
router.post("/:id/like", postsController.likePost);
router.post("/:id/comment", postsController.commentPost);
router.post("/:id/repost", postsController.repost);

export default router;
