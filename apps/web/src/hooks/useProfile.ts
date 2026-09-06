import { useQuery, useMutation } from "react-query";
import { api } from "../lib/api";

export const useProfile = () => useQuery("profile", () => api.get("/users/me").then(res => res.data));
export const useUpdateProfile = () => useMutation((data: any) => api.patch("/users/me", data));

