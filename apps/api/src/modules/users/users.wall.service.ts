import { PrismaClient } from "@prisma/client";
import { io } from "../../sockets";

const prisma = new PrismaClient();

export const usersWallService = {
  getWallPosts: async (profileId: string, userId: string) => {
    const profile = await prisma.user.findUnique({
      where: { id: profileId },
      include: {
        authoredComments: { where: { profileId }, include: { author: { select: { id: true, name: true, avatarUrl: true } } } },
        authoredLikes: { where: { profileId }, select: { authorId: true } }
      }
    });
    return profile;
  },

  postComment: async (authorId: string, profileId: string, content: string) => {
    // Basic validation to ensure they are connected (Match ACCEPTED)
    const match = await prisma.match.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requestedById: authorId, requestedToId: profileId },
          { requestedById: profileId, requestedToId: authorId }
        ]
      }
    });
    if (!match && authorId !== profileId) throw { statusCode: 403, message: "You are not connected with this user" };

    const comment = await prisma.profileComment.create({
      data: { authorId, profileId, content },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } }
    });
    
    if (authorId !== profileId && io) {
      io.to(profileId).emit("profile:comment", { profileId, comment });
    }

    return comment;
  },

  likeProfile: async (authorId: string, profileId: string) => {
    const match = await prisma.match.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requestedById: authorId, requestedToId: profileId },
          { requestedById: profileId, requestedToId: authorId }
        ]
      }
    });
    if (!match && authorId !== profileId) throw { statusCode: 403, message: "You are not connected with this user" };

    const existingLike = await prisma.profileLike.findUnique({
      where: { profileId_authorId: { profileId, authorId } }
    });

    if (existingLike) {
      await prisma.profileLike.delete({ where: { id: existingLike.id } });
      return { liked: false };
    } else {
      await prisma.profileLike.create({ data: { profileId, authorId } });
      if (authorId !== profileId && io) {
        io.to(profileId).emit("profile:like", { profileId, authorId });
      }
      return { liked: true };
    }
  }
};
