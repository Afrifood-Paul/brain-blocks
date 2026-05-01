import { io } from "socket.io-client";
import { apiClient } from "./api";

export const socket = io("http://localhost:5000", {
  autoConnect: false,
  auth: {
    token: apiClient.getToken(), // reuse your auth
  },
});