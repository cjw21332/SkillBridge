import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { postsService } from "./posts.service";

export const postsController = {
  getFeed: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const feed = await postsService.getFeed(userId, limit, offset);
      res.json(feed);
    } catch (err) {
      next(err);
    }
  },

  getUserPosts: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const viewerId = req.user?.id;
      const posts = await postsService.getUserPosts(userId, viewerId);
      res.json(posts);
    } catch (err) {
      next(err);
    }
  },

  createPost: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authorId = req.user!.id;
      const { content, originalPostId } = req.body;

      if (!content && !originalPostId) {
        return res.status(400).json({ error: { code: "INVALID_INPUT", message: "Content or original post is required" } });
      }

      const post = await postsService.createPost(authorId, content, originalPostId);
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  },

  likePost: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await postsService.likePost(userId, id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  commentPost: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: { code: "INVALID_INPUT", message: "Comment content cannot be empty" } });
      }

      const comment = await postsService.commentPost(userId, id, content.trim());
      res.status(201).json(comment);
    } catch (err) {
      next(err);
    }
  },

  repost: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { content } = req.body;
      const repost = await postsService.createPost(userId, content || "", id);
      res.status(201).json(repost);
    } catch (err) {
      next(err);
    }
  },
};
