import { io } from "socket.io-client";
import { apiClient } from "./api";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api$/, "") ||
  "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: {
    token: apiClient.getToken(),
  },
});

export const connectSocket = () => {
  socket.auth = { token: apiClient.getToken() };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};
