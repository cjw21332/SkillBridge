import { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service";
import { PrismaClient } from "@prisma/client";
import { io } from "../../sockets";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const prisma = new PrismaClient();

export const usersController = {
  getMe: async (req: Request, res: Response) => {
    const user = await usersService.getProfile((req as any).user.userId);
    res.json(user);
  },
  getUploadSignature: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const folder = "skillbridge/avatars";
      const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        process.env.CLOUDINARY_API_SECRET || "secret"
      );
      res.json({
        signature,
        timestamp,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        folder,
      });
    } catch (err) {
      next(err);
    }
  },
  updateMe: async (req: Request, res: Response) => {
    const user = await usersService.updateProfile((req as any).user.userId, req.body);
    if (io) {
      io.emit("user:profile_updated", {
        userId: user.id,
        avatarUrl: user.avatarUrl,
        name: user.name,
        coverUrl: user.coverUrl,
      });
    }
    res.json(user);
  },
  updateMeSkills: async (req: Request, res: Response) => {
    const { teachSkills, learnSkills } = req.body;
    await usersService.updateSkills((req as any).user.userId, teachSkills, learnSkills);
    const user = await usersService.getProfile((req as any).user.userId);
    res.json(user);
  },
  updateMeAvailability: async (req: Request, res: Response) => {
    const { availability } = req.body;
    if (!Array.isArray(availability)) {
      return res.status(400).json({ error: { code: "INVALID_BODY", message: "availability must be an array" } });
    }
    await usersService.updateAvailability((req as any).user.userId, availability);
    const user = await usersService.getProfile((req as any).user.userId);
    res.json(user);
  },
  getPublicProfile: async (req: Request, res: Response) => {
    const targetId = req.params.id;
    const viewerId = (req as any).user?.id || (req as any).user?.userId;

    const user = await usersService.getProfile(targetId);
    if (!user) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }

    const { email, passwordHash, ...publicProfile } = user as any;
    // Ensure skills expose name (not just category) in public profile
    if (publicProfile.teachSkills) {
      publicProfile.teachSkills = publicProfile.teachSkills.map((s: any) => ({ ...s, skill: s.skill ? { id: s.skill.id, name: s.skill.name, category: s.skill.category } : null }));
    }
    if (publicProfile.learnSkills) {
      publicProfile.learnSkills = publicProfile.learnSkills.map((s: any) => ({ ...s, skill: s.skill ? { id: s.skill.id, name: s.skill.name, category: s.skill.category } : null }));
    }

    let isSelf = viewerId === targetId;
    let isConnected = isSelf;
    let matchId: string | null = null;
    let matchStatus: string | null = null;
    let isRequester = false;

    if (!isSelf && viewerId) {
      const match = await prisma.match.findFirst({
        where: {
          OR: [
            { requestedById: viewerId, requestedToId: targetId },
            { requestedById: targetId, requestedToId: viewerId },
          ],
        },
      });

      if (match) {
        matchId = match.id;
        matchStatus = match.status;
        isConnected = match.status === "ACCEPTED";
        isRequester = match.requestedById === viewerId;
      }
    }

    res.json({
      ...publicProfile,
      isSelf,
      isConnected,
      matchId,
      matchStatus,
      isRequester,
    });
  },
};
