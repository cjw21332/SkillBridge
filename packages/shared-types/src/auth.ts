import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

