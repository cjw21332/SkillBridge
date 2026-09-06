import { skillsRepository } from "./skills.repository";

export const skillsService = {
  search: (query: string, limit?: number) => skillsRepository.searchSkills(query, limit),
  create: (name: string, category: string) => skillsRepository.createSkill(name, category),
};
