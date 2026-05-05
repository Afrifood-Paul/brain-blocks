const jwt = require("jsonwebtoken");
const { Chess } = require("chess.js");
const Game = require("../models/Game");
const User = require("../models/User");

const STARTING_FEN = new Chess().fen();
const DEFAULT_TIME_SECONDS = 600;
const activeSocketsByUser = new Map();
const gameLocks = new Map();
const timersByGame = new Map();

const getRoomName = (gameId) => `game:${gameId}`;

const getSocketUserId = (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    return String(jwt.verify(token, process.env.JWT_SECRET).id);
  } catch {
    return null;
  }
};

const getPlayerKey = (socket) => socket.data.userId || socket.id;

const sameId = (left, right) =>
  Boolean(left && right && String(left) === String(right));

const playerMatchesSocket = (player, socket) => {
  if (!player) return false;

  const playerKey = getPlayerKey(socket);
  return sameId(player.userId, playerKey) || player.socketId === socket.id;
};

const hasBothPlayers = (game) => Boolean(game.players.white && game.players.black);

const hasTimerStarted = (game) => Boolean(game.timerStartedAt);

const restoreMissingTimerStart = (game) => {
  if (game.timerStartedAt || !game.moveHistory.length) return;

  game.timerStartedAt =
    game.moveHistory[0]?.movedAt || game.lastTimerStartedAt || new Date();

  if (!game.lastTimerStartedAt) {
    game.lastTimerStartedAt = game.timerStartedAt;
  }
};

const applyTimer = (game, now = new Date()) => {
  if (game.status !== "active") {
    return;
  }

  restoreMissingTimerStart(game);

  if (!hasBothPlayers(game) || !hasTimerStarted(game)) {
    return;
  }

  const elapsed = Math.max(
    0,
    Math.floor((now.getTime() - game.timerStartedAt.getTime()) / 1000)
  );

  const duration = game.duration || DEFAULT_TIME_SECONDS;
  const sharedTime = Math.max(0, duration - elapsed);

  game.sharedTime = sharedTime;
  game.whiteTime = sharedTime;
  game.blackTime = sharedTime;

  if (sharedTime === 0) {
    game.status = "draw";
  }
};

const getWinnerColor = (game) => {
  if (game.status !== "checkmate") return null;
  return game.currentTurn === "w" ? "b" : "w";
};

const serializeGame = (game) => ({
  gameId: game.gameId,
  players: game.players,
  boardState: game.boardState,
  fen: game.boardState,
  moveHistory: game.moveHistory,
  currentTurn: game.currentTurn,
  turn: game.currentTurn,
  sharedTime: game.sharedTime ?? game.duration ?? DEFAULT_TIME_SECONDS,
  whiteTime: game.sharedTime ?? game.whiteTime ?? DEFAULT_TIME_SECONDS,
  blackTime: game.sharedTime ?? game.blackTime ?? DEFAULT_TIME_SECONDS,
  timerStartedAt: game.timerStartedAt,
  status: game.status,
  winnerColor: getWinnerColor(game),
  winner: getWinnerColor(game)
    ? getWinnerColor(game) === "w"
      ? game.players.white
      : game.players.black
    : null,
  createdAt: game.createdAt,
  updatedAt: game.updatedAt,
});

const loadChess = (boardState) => {
  const chess = new Chess();
  chess.load(boardState || STARTING_FEN);
  return chess;
};

const resolveStatus = (chess) => {
  if (chess.isCheckmate()) return "checkmate";
  if (chess.isDraw()) return "draw";
  return "active";
};

const getUserProfile = async (userId) => {
  if (!userId) return {};

  const user = await User.findById(userId).select(
    "firstName lastName username avatar"
  );
  if (!user) return {};

  return {
    username: user.username,
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username,
    avatar: user.avatar || "",
  };
};

const updatePlayerSocket = (player, socket, profile) => ({
  ...(player?.toObject?.() || player || {}),
  socketId: socket.id,
  ...profile,
});

const assignPlayer = async (game, socket) => {
  const profile = await getUserProfile(socket.data.userId);
  const player = {
    userId: getPlayerKey(socket),
    socketId: socket.id,
    ...profile,
  };

  if (playerMatchesSocket(game.players.white, socket)) {
    game.players.white = updatePlayerSocket(game.players.white, socket, profile);
    game.markModified("players");
    return "w";
  }

  if (playerMatchesSocket(game.players.black, socket)) {
    game.players.black = updatePlayerSocket(game.players.black, socket, profile);
    game.markModified("players");
    return "b";
  }

  if (!game.players.white && (!game.createdBy || sameId(game.createdBy, player.userId))) {
    game.players.white = player;
    game.markModified("players");
    return "w";
  }

  if (
    game.directChallenge &&
    game.opponentUserId &&
    !sameId(game.opponentUserId, player.userId)
  ) {
    return null;
  }

  if (!game.players.black) {
    game.players.black = player;
    game.markModified("players");
    return "b";
  }

  return null;
};

// const getSocketColor = (game, socket) => {
//   if (
//     socket.data.color === "w" &&
//     playerMatchesSocket(game.players.white, socket)
//   ) {
//     return "w";
//   }

//   if (
//     socket.data.color === "b" &&
//     playerMatchesSocket(game.players.black, socket)
//   ) {
//     return "b";
//   }

//   if (playerMatchesSocket(game.players.white, socket)) {
//     socket.data.color = "w";
//     return "w";
//   }

//   if (playerMatchesSocket(game.players.black, socket)) {
//     socket.data.color = "b";
//     return "b";
//   }

//   return null;
// };


const getPersistedSocketColor = (game, socket) => {
  if (playerMatchesSocket(game.players.white, socket)) return "w";
  if (playerMatchesSocket(game.players.black, socket)) return "b";
  return null;
};

const getSocketColor = (game, socket) => {
  const persistedColor = getPersistedSocketColor(game, socket);

  if (socket.data.color && socket.data.color === persistedColor) {
    return socket.data.color;
  }

  socket.data.color = persistedColor;
  return persistedColor;
};

const emitGameToRoom = (io, gameId, event, game, extra = {}) => {
  const roomName = getRoomName(gameId);
  const room = io.sockets.adapter.rooms.get(roomName);

  if (!room?.size) return;

  for (const socketId of room) {
    const roomSocket = io.sockets.sockets.get(socketId);
    if (!roomSocket) continue;

    roomSocket.emit(event, {
      ...serializeGame(game),
      ...extra,
      playerColor: getSocketColor(game, roomSocket),
    });
  }
};

const withGameLock = (gameId, task) => {
  const previous = gameLocks.get(gameId) || Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  const stored = next.finally(() => {
    if (gameLocks.get(gameId) === stored) {
      gameLocks.delete(gameId);
    }
  });

  gameLocks.set(gameId, stored);

  return next;
};

const getOrCreateGame = async (gameId) => {
  let game = await Game.findOne({ gameId });
  if (game) return game;

  try {
    return await Game.create({
      gameId,
      boardState: STARTING_FEN,
      currentTurn: "w",
      sharedTime: DEFAULT_TIME_SECONDS,
      whiteTime: DEFAULT_TIME_SECONDS,
      blackTime: DEFAULT_TIME_SECONDS,
      timerStartedAt: null,
      lastTimerStartedAt: null,
      status: "active",
    });
  } catch (error) {
    if (error.code === 11000) {
      return Game.findOne({ gameId });
    }

    throw error;
  }
};

const startGameTimer = (io, gameId) => {
  if (timersByGame.has(gameId)) return;

  const interval = setInterval(() => {
    withGameLock(gameId, async () => {
      const room = io.sockets.adapter.rooms.get(getRoomName(gameId));
      if (!room?.size) {
        clearInterval(interval);
        timersByGame.delete(gameId);
        return;
      }

      const game = await Game.findOne({ gameId });
      if (!game || game.status !== "active") {
        if (game) {
          emitGameToRoom(io, gameId, "game_state", game);
        }
        clearInterval(interval);
        timersByGame.delete(gameId);
        return;
      }

      applyTimer(game);
      await game.save();

      emitGameToRoom(io, gameId, "game_state", game);

      if (game.status !== "active") {
        emitGameToRoom(io, gameId, "game_over", game);
        clearInterval(interval);
        timersByGame.delete(gameId);
      }
    }).catch(() => undefined);
  }, 1000);

  timersByGame.set(gameId, interval);
};

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.data.userId = getSocketUserId(socket);

    if (socket.data.userId) {
      const existingSocketId = activeSocketsByUser.get(socket.data.userId);
      if (existingSocketId && existingSocketId !== socket.id) {
        io.sockets.sockets.get(existingSocketId)?.disconnect(true);
      }

      activeSocketsByUser.set(socket.data.userId, socket.id);
    }

    socket.on("join_game", async (payload) => {
      const gameId =
        typeof payload === "string" ? payload : payload?.gameId;

      if (!socket.data.userId) {
        socket.emit("game_state", { error: "Authentication required" });
        return;
      }

      if (!gameId) {
        socket.emit("game_state", { error: "gameId is required" });
        return;
      }

      try {
        await withGameLock(gameId, async () => {
          const previousGameId = socket.data.gameId;
          if (previousGameId && previousGameId !== gameId) {
            socket.leave(getRoomName(previousGameId));
          }

          const game = await getOrCreateGame(gameId);
          const color = await assignPlayer(game, socket);

          if (!color) {
            socket.emit("game_state", {
              gameId,
              error: "Game is full or restricted",
            });
            return;
          }

          socket.data.gameId = gameId;
          socket.join(getRoomName(gameId));
          applyTimer(game);

          if (game.isModified()) {
            await game.save();
          }

          socket.data.color = color;
          emitGameToRoom(io, gameId, "game_state", game);
          startGameTimer(io, gameId);
        });
      } catch {
        socket.emit("game_state", {
          gameId,
          error: "Unable to join game",
        });
      }
    });

    socket.on("make_move", async ({ gameId, move } = {}) => {
      if (!gameId || !move) return;

      try {
        await withGameLock(gameId, async () => {
          const game = await Game.findOne({ gameId });
          if (!game || game.status !== "active") return;

          applyTimer(game);
          if (game.status !== "active") {
            await game.save();
            emitGameToRoom(io, gameId, "game_state", game);
            emitGameToRoom(io, gameId, "game_over", game);
            return;
          }

          const playerColor = getSocketColor(game, socket);
          if (!playerColor || playerColor !== game.currentTurn) return;

          const chess = loadChess(game.boardState);
          const piece = chess.get(move.from);

          if (!piece || piece.color !== playerColor) return;

          let result;
          try {
            result = chess.move({
              from: move.from,
              to: move.to,
              promotion: move.promotion || "q",
            });
          } catch {
            return;
          }

          if (!result) return;

          game.boardState = chess.fen();
          game.currentTurn = chess.turn();
          game.status = resolveStatus(chess);
          const moveTime = new Date();
          if (!game.timerStartedAt) {
            game.timerStartedAt = moveTime;
            game.sharedTime = game.duration || DEFAULT_TIME_SECONDS;
            game.whiteTime = game.sharedTime;
            game.blackTime = game.sharedTime;
          }
          game.lastTimerStartedAt = moveTime;
          game.moveHistory.push({
            from: result.from,
            to: result.to,
            promotion: result.promotion || null,
            san: result.san,
            color: result.color,
            fen: game.boardState,
          });

          await game.save();

          const movePayload = {
              from: result.from,
              to: result.to,
              promotion: result.promotion || null,
              san: result.san,
              color: result.color,
          };

          emitGameToRoom(io, gameId, "move_made", game, {
            move: movePayload,
          });

          if (game.status !== "active") {
            emitGameToRoom(io, gameId, "game_over", game, {
              move: movePayload,
            });
          }
        });
      } catch {
        return;
      }
    });

    socket.on("disconnect", () => {
      if (
        socket.data.userId &&
        activeSocketsByUser.get(socket.data.userId) === socket.id
      ) {
        activeSocketsByUser.delete(socket.data.userId);
      }
    });
  });
};
