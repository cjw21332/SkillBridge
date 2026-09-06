import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: string; userId: string; role: string };
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing token" } });
  
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    (req as any).user = { id: decoded.userId, userId: decoded.userId, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid token" } });
  }
};

export const authenticate = authMiddleware;
