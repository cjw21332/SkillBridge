import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../stores/authStore";

let socket: Socket | null = null;
let currentToken: string | null = null;

export const getSocket = (): Socket | null => {
  const token = useAuthStore.getState().accessToken;
  
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
      currentToken = null;
    }
    return null;
  }

  if (!socket || token !== currentToken) {
    if (socket) socket.disconnect();
    
    currentToken = token;
    socket = io("http://localhost:3000", {
      auth: { token },
      autoConnect: true,
      reconnection: true,
    });
  }

  return socket;
};
