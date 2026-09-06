import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);
      res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      if (!result) {
        return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
      }
      res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  refresh: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      const result = await authService.refresh(token);
      res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      res.json({ status: "ok", message: "Logged out successfully" });
    } catch (err) {
      next(err);
    }
  },

  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await authService.resetPassword(email, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  verifyEmail: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      const result = await authService.verifyEmail(token);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
