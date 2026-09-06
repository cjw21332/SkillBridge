import { messagesRepository } from "./messages.repository";
import { io } from "../../sockets";
import { notificationsService } from "../notifications/notifications.service";

export const messagesService = {
  getMessages: async (matchId: string, userId: string, limit = 20, offset = 0) => {
    const match = await messagesRepository.findMatchById(matchId);
    if (!match) {
      const error: any = new Error("Match not found");
      error.statusCode = 404;
      error.status = 404;
      throw error;
    }

    if (match.requestedById !== userId && match.requestedToId !== userId) {
      const error: any = new Error("You are not a participant in this match");
      error.statusCode = 403;
      error.status = 403;
      throw error;
    }

    return messagesRepository.getMessages(matchId, limit, offset);
  },

  sendMessage: async (matchId: string, senderId: string, content: string) => {
    const match = await messagesRepository.findMatchById(matchId);
    if (!match) {
      const error: any = new Error("Match not found");
      error.statusCode = 404;
      error.status = 404;
      throw error;
    }

    if (match.requestedById !== senderId && match.requestedToId !== senderId) {
      const error: any = new Error("You are not a participant in this match");
      error.statusCode = 403;
      error.status = 403;
      throw error;
    }

    if (match.status !== "ACCEPTED") {
      const error: any = new Error("Cannot send messages unless match status is ACCEPTED");
      error.statusCode = 400;
      error.status = 400;
      throw error;
    }

    const message = await messagesRepository.createMessage(matchId, senderId, content);

    // Emit real-time notification to both participants' rooms
    if (io) {
      io.to(match.requestedById).to(match.requestedToId).emit("message:new", message);
    }

    // Create persistent notification for recipient ONLY if they do NOT have this match thread actively open
    const recipientId = match.requestedById === senderId ? match.requestedToId : match.requestedById;
    let isRecipientActive = false;

    if (io) {
      const room = io.sockets.adapter.rooms.get(`match:${matchId}`);
      if (room) {
        for (const socketId of room) {
          const s = io.sockets.sockets.get(socketId);
          if (s && (s as any).userId === recipientId) {
            isRecipientActive = true;
            break;
          }
        }
      }
    }

    if (!isRecipientActive) {
      await notificationsService.createNotification(recipientId, "NEW_MESSAGE", {
        matchId,
        messageId: message.id,
        senderId,
        senderName: message.sender.name,
        preview: content.length > 50 ? content.slice(0, 50) + "..." : content,
      });
    }

    return message;
  },

  markAsRead: async (matchId: string, userId: string) => {
    const match = await messagesRepository.findMatchById(matchId);
    if (!match) {
      const error: any = new Error("Match not found");
      error.statusCode = 404;
      error.status = 404;
      throw error;
    }

    if (match.requestedById !== userId && match.requestedToId !== userId) {
      const error: any = new Error("You are not a participant in this match");
      error.statusCode = 403;
      error.status = 403;
      throw error;
    }

    const updateResult = await messagesRepository.markAsRead(matchId, userId);

    if (updateResult.count > 0 && io) {
      const otherUserId = match.requestedById === userId ? match.requestedToId : match.requestedById;
      const readTimestamp = new Date().toISOString();
      io.to(otherUserId).emit("message:read", { matchId, readBy: userId, readAt: readTimestamp });
    }

    return updateResult;
  },
};
