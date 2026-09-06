import { usersRepository } from "./users.repository";

export const usersService = {
  getProfile: (id: string) => usersRepository.findUserById(id),
  updateProfile: (id: string, data: any) => usersRepository.updateUser(id, data),
  updateSkills: (userId: string, teachSkills: any[] = [], learnSkills: any[] = []) => {
    const items: { skillId: string; type: "TEACH" | "LEARN"; level?: number | null }[] = [
      ...teachSkills.map((s) => ({ skillId: s.skillId, type: "TEACH" as const, level: s.level ?? null })),
      ...learnSkills.map((s) => ({ skillId: s.skillId, type: "LEARN" as const, level: null })),
    ];
    return usersRepository.replaceUserSkills(userId, items);
  },
  updateAvailability: (userId: string, availability: any[]) => usersRepository.updateAvailability(userId, availability),
};
