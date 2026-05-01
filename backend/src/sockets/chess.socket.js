const { Chess } = require("chess.js");

const games = {}; // later move to Redis or DB if needed

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // JOIN GAME
    socket.on("join-game", (gameId) => {
      socket.join(gameId);

      if (!games[gameId]) {
        games[gameId] = {
          chess: new Chess(),
          players: [],
          turn: "w",
        };
      }

      const game = games[gameId];

      if (game.players.length < 2) {
        game.players.push(socket.id);
      }

      io.to(gameId).emit("game-state", {
        fen: game.chess.fen(),
        players: game.players,
        turn: game.turn,
      });
    });

    // MOVE
    socket.on("move", ({ gameId, move }) => {
      const game = games[gameId];
      if (!game) return;

      const result = game.chess.move(move);
      if (!result) return;

      game.turn = game.turn === "w" ? "b" : "w";

      io.to(gameId).emit("move", {
        fen: game.chess.fen(),
        turn: game.turn,
      });
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};