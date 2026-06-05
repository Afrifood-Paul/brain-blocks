require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { Server } = require("socket.io");
const chessSocket = require("./sockets/chess.socket");
const ludoSocket = require("./sockets/ludo.socket");

connectDB();
const PORT = Number(process.env.PORT || 5000);
const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "*";

// create HTTP server from express app
const server = http.createServer(app);

// attach socket.io to server
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
  },
});

// initialize socket logic
chessSocket(io);
ludoSocket(io);

// start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
