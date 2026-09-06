import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { PrismaClient } from "@prisma/client";
import { usersWallService } from "./users.wall.service";

const prisma = new PrismaClient();

export const usersWallController = {
  getProfileWall: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const profileId = req.params.id || req.params.userId;
      const userId = req.user!.id;

      const profile = await prisma.user.findUnique({
        where: { id: profileId },
        include: {
          teachSkills: { where: { type: "TEACH" }, include: { skill: true } },
          learnSkills: { where: { type: "LEARN" }, include: { skill: true } },
        },
      });

      if (!profile) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
      }

      const [comments, likesCount, userLikedRow] = await Promise.all([
        prisma.profileComment.findMany({
          where: { profileId },
          include: { author: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: "asc" },
          take: 50,
        }),
        prisma.profileLike.count({ where: { profileId } }),
        prisma.profileLike.findUnique({
          where: { profileId_authorId: { profileId, authorId: userId } },
        }),
      ]);

      const { passwordHash, ...safeProfile } = profile as any;

      res.json({ ...safeProfile, wallComments: comments, likesCount, userLiked: !!userLikedRow });
    } catch (err) {
      next(err);
    }
  },

  postWallComment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const profileId = req.params.id || req.params.userId;
      const authorId = req.user!.id;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: { code: "INVALID_INPUT", message: "Comment content is required" } });
      }

      const comment = await usersWallService.postComment(authorId, profileId, content.trim());
      res.status(201).json(comment);
    } catch (err) {
      next(err);
    }
  },

  toggleProfileLike: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const profileId = req.params.id || req.params.userId;
      const authorId = req.user!.id;
      const result = await usersWallService.likeProfile(authorId, profileId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
