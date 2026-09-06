import { PrismaClient } from "@prisma/client";
const SkillType = { TEACH: "TEACH" as const, LEARN: "LEARN" as const };
const prisma = new PrismaClient();

const skillInclude = {
  id: true,
  name: true,
  category: true,
};

const userWithSkillsInclude = {
  teachSkills: { where: { type: SkillType.TEACH }, include: { skill: { select: skillInclude } } },
  learnSkills: { where: { type: SkillType.LEARN }, include: { skill: { select: skillInclude } } },
  availability: true,
};

export const usersRepository = {
  findUserById: (id: string) => prisma.user.findUnique({
    where: { id },
    include: userWithSkillsInclude,
  }),
  updateLastSeen: (id: string) =>
    prisma.user.update({ where: { id }, data: { lastSeenAt: new Date() } }),
  updateUser: (id: string, data: any) => prisma.user.update({ where: { id }, data }),
  replaceUserSkills: (userId: string, skills: { skillId: string; type: "TEACH" | "LEARN"; level?: number | null }[]) =>
    prisma.$transaction([
      prisma.userSkill.deleteMany({ where: { userId } }),
      ...skills.map(s =>
        prisma.userSkill.create({ data: { userId, skillId: s.skillId, type: s.type, level: s.level ?? null } })
      ),
    ]),
  updateAvailability: (userId: string, availability: any[]) => prisma.$transaction([
    prisma.availability.deleteMany({ where: { userId } }),
    prisma.availability.createMany({ data: availability.map(a => ({ ...a, userId })) })
  ]),
};
