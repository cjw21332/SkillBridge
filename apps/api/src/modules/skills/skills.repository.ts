import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const skillsRepository = {
  searchSkills: (query: string, limit = 12) => prisma.skill.findMany({ 
    where: { 
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } }
      ]
    },
    orderBy: { name: "asc" },
    take: limit 
  }),
  createSkill: (name: string, category: string) => prisma.skill.upsert({
    where: { name },
    update: {},
    create: { name, category }
  }),
};
