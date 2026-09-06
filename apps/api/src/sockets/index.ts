import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { registerMessageHandlers } from "./handlers/message.handler";

export let io: Server;

export const initSocket = async (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          origin === process.env.FRONTEND_URL ||
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
          return callback(null, true);
        }
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    },
  });

  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const pubClient = createClient({ url: redisUrl });
  const subClient = pubClient.duplicate();

  try {
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Socket.io Redis adapter successfully connected and wired.");
  } catch (err) {
    console.error("Warning: Failed to connect Redis adapter for Socket.io (fallback to memory):", err);
  }

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Unauthorized"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      (socket as any).userId = decoded.userId;
      socket.join(decoded.userId);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    registerMessageHandlers(io, socket);
  });
};
