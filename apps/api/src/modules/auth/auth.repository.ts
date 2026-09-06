import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const authRepository = {
  createUser: (data: any) => prisma.user.create({ data }),
  findUserById: (id: string) => prisma.user.findUnique({ where: { id } }),
  findUserByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  updateUser: (id: string, data: any) => prisma.user.update({ where: { id }, data }),
  createRefreshToken: (data: any) => prisma.refreshToken.create({ data }),
  findRefreshToken: (tokenHash: string) => prisma.refreshToken.findFirst({ where: { tokenHash } }),
  revokeRefreshToken: (id: string) => prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } }),
};
