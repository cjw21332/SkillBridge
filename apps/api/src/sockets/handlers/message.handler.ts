import { Server, Socket } from "socket.io";
import { messagesService } from "../../modules/messages/messages.service";
import { messagesRepository } from "../../modules/messages/messages.repository";
import { usersRepository } from "../../modules/users/users.repository";

const ONLINE_WINDOW_MS = 60_000; // consider online if heartbeat < 60s ago

export const registerMessageHandlers = (io: Server, socket: Socket) => {
  const userId = (socket as any).userId;

  socket.on("match:join", (data: { matchId: string }) => {
    if (data?.matchId) {
      socket.join(`match:${data.matchId}`);
    }
  });

  socket.on("match:leave", (data: { matchId: string }) => {
    if (data?.matchId) {
      socket.leave(`match:${data.matchId}`);
    }
  });

  socket.on("message:send", async (data: { matchId: string; content: string }, callback?: Function) => {
    try {
      if (!data || !data.matchId || !data.content) {
        if (callback) callback({ error: "matchId and content are required" });
        return;
      }

      const message = await messagesService.sendMessage(data.matchId, userId, data.content);
      if (callback) callback({ status: "ok", data: message });
    } catch (err: any) {
      if (callback) callback({ error: err.message || "Failed to send message" });
    }
  });

  socket.on("typing:start", async (data: { matchId: string }) => {
    try {
      if (!data || !data.matchId) return;
      const match = await messagesRepository.findMatchById(data.matchId);
      if (!match) return;

      const otherUserId = match.requestedById === userId ? match.requestedToId : match.requestedById;
      io.to(otherUserId).emit("typing:update", {
        matchId: data.matchId,
        userId,
        isTyping: true,
      });
    } catch (err) {
      console.error("Error in typing:start", err);
    }
  });

  socket.on("typing:stop", async (data: { matchId: string }) => {
    try {
      if (!data || !data.matchId) return;
      const match = await messagesRepository.findMatchById(data.matchId);
      if (!match) return;

      const otherUserId = match.requestedById === userId ? match.requestedToId : match.requestedById;
      io.to(otherUserId).emit("typing:update", {
        matchId: data.matchId,
        userId,
        isTyping: false,
      });
    } catch (err) {
      console.error("Error in typing:stop", err);
    }
  });

  // Heartbeat: client pings periodically so the server knows it's alive
  socket.on("presence:ping", async () => {
    try {
      await usersRepository.updateLastSeen(userId);
      // Broadcast to all connected viewers (e.g., the partner's chat page)
      io.emit("presence:update", { userId, lastSeenAt: new Date().toISOString() });
    } catch {
      // swallow — presence is best-effort
    }
  });
};
