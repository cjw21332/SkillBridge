import { PrismaClient } from "@prisma/client";
import { io } from "../../sockets";

const prisma = new PrismaClient();

const postInclude = {
  author: { select: { id: true, name: true, avatarUrl: true } },
  originalPost: {
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
    },
  },
  likes: { select: { userId: true } },
  comments: {
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
  _count: {
    select: { likes: true, comments: true, reposts: true },
  },
};

export const postsService = {
  createPost: async (authorId: string, content: string, originalPostId?: string) => {
    if (originalPostId) {
      const original = await prisma.post.findUnique({ where: { id: originalPostId } });
      if (!original) throw { statusCode: 404, message: "Original post not found" };
      // If reposting a repost, link to the root original post
      originalPostId = original.originalPostId || original.id;
    }

    const post = await prisma.post.create({
      data: {
        authorId,
        content: content || "",
        originalPostId: originalPostId || null,
      },
      include: postInclude,
    });

    if (io) {
      io.emit("feed:new_post", post);
    }

    return post;
  },

  getFeed: async (userId: string, limit = 50, offset = 0) => {
    // 1. Get friend IDs from ACCEPTED matches
    const acceptedMatches = await prisma.match.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requestedById: userId }, { requestedToId: userId }],
      },
      select: { requestedById: true, requestedToId: true },
    });

    const friendIds = new Set<string>([userId]);
    for (const m of acceptedMatches) {
      friendIds.add(m.requestedById);
      friendIds.add(m.requestedToId);
    }

    // 2. Fetch posts from friends + self
    let posts = await prisma.post.findMany({
      where: { authorId: { in: Array.from(friendIds) } },
      include: postInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // 3. If user has few friends or friend posts, include recent community posts
    if (posts.length < 5) {
      const existingIds = new Set(posts.map((p) => p.id));
      const communityPosts = await prisma.post.findMany({
        where: { id: { notIn: Array.from(existingIds) } },
        include: postInclude,
        orderBy: { createdAt: "desc" },
        take: limit - posts.length,
      });
      posts = [...posts, ...communityPosts];
    }

    return posts;
  },

  getUserPosts: async (targetUserId: string, viewerId?: string) => {
    if (viewerId && viewerId !== targetUserId) {
      const isFriend = await prisma.match.findFirst({
        where: {
          status: "ACCEPTED",
          OR: [
            { requestedById: viewerId, requestedToId: targetUserId },
            { requestedById: targetUserId, requestedToId: viewerId },
          ],
        },
      });

      if (!isFriend) {
        return []; // Restricted: only friends/connections can view posts on user profile!
      }
    }

    return prisma.post.findMany({
      where: { authorId: targetUserId },
      include: postInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  likePost: async (userId: string, postId: string) => {
    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    let liked = false;
    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      await prisma.postLike.create({ data: { postId, userId } });
      liked = true;
    }

    const likesCount = await prisma.postLike.count({ where: { postId } });

    if (io) {
      io.emit("post:like_update", { postId, userId, liked, likesCount });
    }

    return { liked, likesCount };
  },

  commentPost: async (userId: string, postId: string, content: string) => {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw { statusCode: 404, message: "Post not found" };

    const comment = await prisma.postComment.create({
      data: {
        authorId: userId,
        postId,
        content,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (io) {
      io.emit("post:comment_new", { postId, comment });
    }

    return comment;
  },
};
