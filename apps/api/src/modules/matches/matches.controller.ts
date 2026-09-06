import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { matchesService } from "./matches.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const matchesController = {
  requestMatch: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const requestedById = req.user!.id;
      const { requestedToId } = req.body;
      const match = await matchesService.requestMatch(requestedById, requestedToId);
      res.status(201).json(match);
    } catch (err) {
      next(err);
    }
  },

  updateMatchStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user!.id;

      const existingMatch = await prisma.match.findUnique({ where: { id } });
      if (!existingMatch) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Match not found" } });
      }

      if (existingMatch.requestedById !== userId && existingMatch.requestedToId !== userId) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "You are not a participant in this match" } });
      }

      if (status === "ACCEPTED") {
        const match = await matchesService.acceptMatch(id, userId);
        return res.json(match);
      }

      const match = await prisma.match.update({
        where: { id },
        data: { status },
      });
      res.json(match);
    } catch (err) {
      next(err);
    }
  },

  getMatches: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const matches = await prisma.match.findMany({
        where: {
          OR: [{ requestedById: userId }, { requestedToId: userId }],
        },
        include: {
          requestedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
          requestedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
      res.json(matches);
    } catch (err) {
      next(err);
    }
  },
};
