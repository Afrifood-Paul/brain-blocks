

require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { Server } = require("socket.io");
const chessSocket = require("./sockets/chess.socket");

connectDB();

// create HTTP server from express app
const server = http.createServer(app);

// attach socket.io to server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// initialize socket logic
chessSocket(io);

// start server
server.listen(5000, () => {
  console.log("Server running on port 5000");
});