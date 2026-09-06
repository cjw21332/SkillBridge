import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authRepository } from "./auth.repository";

export const authService = {
  register: async (data: any) => {
    const existing = await authRepository.findUserByEmail(data.email);
    if (existing) {
      const error: any = new Error("User with this email already exists");
      error.statusCode = 400;
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await authRepository.createUser({
      email: data.email,
      name: data.name,
      passwordHash,
      isVerified: true, // Auto-verify accounts for instant sign-in and usability
    });

    const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: "7d" });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken, user };
  },

  login: async (email: string, password: string) => {
    const user = await authRepository.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;

    const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: "7d" });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken, user };
  },

  refresh: async (refreshToken: string) => {
    if (!refreshToken) {
      const error: any = new Error("Refresh token missing");
      error.statusCode = 401;
      throw error;
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as { userId: string };
      const user = await authRepository.findUserById(decoded.userId);
      if (!user) {
        const error: any = new Error("User not found");
        error.statusCode = 401;
        throw error;
      }

      const newAccessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });
      const newRefreshToken = jwt.sign({ userId: user.id }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: "7d" });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
    } catch {
      const error: any = new Error("Invalid or expired refresh token");
      error.statusCode = 401;
      throw error;
    }
  },

  resetPassword: async (email: string, newPassword: string) => {
    if (!email || !newPassword) {
      const error: any = new Error("Email and new password are required");
      error.statusCode = 400;
      throw error;
    }

    if (newPassword.length < 8) {
      const error: any = new Error("Password must be at least 8 characters long");
      error.statusCode = 400;
      throw error;
    }

    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      const error: any = new Error("No account found with this email address");
      error.statusCode = 404;
      throw error;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await authRepository.updateUser(user.id, { passwordHash });

    return { status: "ok", message: "Password updated successfully. You can now log in." };
  },

  verifyEmail: async (token: string) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await authRepository.findUserById(decoded.userId);
      if (!user) throw { statusCode: 404, message: "User not found" };
      await authRepository.updateUser(user.id, { isVerified: true });
      return { status: "ok", message: "Email verified successfully. Your account is now active." };
    } catch {
      throw { statusCode: 400, message: "Invalid or expired verification link" };
    }
  },
};
