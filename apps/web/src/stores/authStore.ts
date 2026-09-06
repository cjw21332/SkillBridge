import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  user: any | null;
  setAuth: (token: string | null, user?: any) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: (token, user) => set({ accessToken: token, user }),
      clearAuth: () => set({ accessToken: null, user: null }),
    }),
    {
      name: "skillbridge-auth",
    }
  )
);
