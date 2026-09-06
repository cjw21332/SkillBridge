import { api } from "../lib/api";
import { RegisterSchema } from "@skillbridge/shared-types";
import { z } from "zod";

export const register = (data: z.infer<typeof RegisterSchema>) => api.post("/auth/register", data);
export const login = (data: any) => api.post("/auth/login", data);
export const refresh = () => api.post("/auth/refresh");
export const logout = () => api.post("/auth/logout");
export const resetPassword = (data: { email: string; password: string }) => api.post("/auth/reset-password", data);

