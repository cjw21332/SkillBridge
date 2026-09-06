import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const requireRole = (role: "ADMIN" | "USER") => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing authorization context" } });
    }

    if (req.user.role !== role && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Insufficient permissions" } });
    }

    next();
  };
};