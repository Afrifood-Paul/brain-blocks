const jwt = require("jsonwebtoken");
const LudoRoom = require("../models/LudoRoom");
const LudoMatch = require("../models/LudoMatch");
const LudoMatchPlayer = require("../models/LudoMatchPlayer");
const LudoMoveHistory = require("../models/LudoMoveHistory");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const {
  activeCoinsExpression,
  getWalletSnapshot,
  inactiveCoinsExpression,
} = require("../utils/wallet");

const COLORS = ["red", "green", "yellow", "blue"];
const START_OFFSETS = { red: 0, green: 13, yellow: 26, blue: 39 };
const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const TOKEN_COUNT = 4;
const FINISHED_PROGRESS = 57;
const roomLocks = new Map();
const timersByRoom = new Map();

const getRoomName = (roomId) => `ludo:${roomId}`;
const sameId = (left, right) => String(left || "") === String(right || "");

const getSocketUserId = (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET).id;
  } catch {
    return null;
  }
};

const withRoomLock = (roomId, task) => {
  const previous = roomLocks.get(roomId) || Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  const stored = next.finally(() => {
    if (roomLocks.get(roomId) === stored) {
      roomLocks.delete(roomId);
    }
  });

  roomLocks.set(roomId, stored);
  return next;
};

const getDisplayName = (user) =>
  `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username;

const serializeRoom = (room, socket = null) => {
  const object = room.toObject ? room.toObject({ flattenMaps: true }) : room;
  const player = socket?.data?.userId
    ? object.players.find((item) => sameId(item.userId, socket.data.userId))
    : null;

  return {
    ...object,
    playerColor: player?.color || null,
    serverTime: Date.now(),
  };
};

const emitRoom = (io, roomId, event, room, extra = {}) => {
  const roomName = getRoomName(roomId);
  const sockets = io.sockets.adapter.rooms.get(roomName);
  if (!sockets?.size) return;

  for (const socketId of sockets) {
    const roomSocket = io.sockets.sockets.get(socketId);
    if (!roomSocket) continue;
    roomSocket.emit(event, { ...serializeRoom(room, roomSocket), ...extra });
  }
};

const getInitialTokens = () =>
  Array.from({ length: TOKEN_COUNT }, (_, index) => ({
    id: index,
    progress: -1,
  }));

const ensureBoard = (room) => {
  for (const player of room.players) {
    if (!room.board.get(player.color)?.length) {
      room.board.set(player.color, getInitialTokens());
    }
  }
};

const getBoardIndex = (color, progress) => {
  if (progress < 0 || progress > 51) return null;
  return (START_OFFSETS[color] + progress) % 52;
};

const getLegalTokenIds = (room, color, dice) => {
  const tokens = room.board.get(color) || [];

  return tokens
    .filter((token) => {
      if (token.progress >= FINISHED_PROGRESS) return false;
      if (token.progress < 0) return dice === 6;
      return token.progress + dice <= FINISHED_PROGRESS;
    })
    .map((token) => token.id);
};

const getNextColor = (room, currentColor) => {
  const activeColors = room.players.map((player) => player.color);
  const currentIndex = activeColors.indexOf(currentColor);
  return activeColors[(currentIndex + 1) % activeColors.length] || activeColors[0];
};

const startTurn = (room, color = room.currentTurn) => {
  const now = new Date();
  room.currentTurn = color;
  room.lastDice = null;
  room.diceRolledBy = null;
  room.mustMove = false;
  room.turnStartedAt = now;
  room.turnDeadlineAt = new Date(now.getTime() + (room.turnSeconds || 25) * 1000);
};

const advanceTurn = (room, keepTurn = false) => {
  const nextColor = keepTurn ? room.currentTurn : getNextColor(room, room.currentTurn);
  startTurn(room, nextColor);
};

const createTransaction = (data) =>
  Transaction.create(data).catch((error) => {
    if (error.code === 11000) return null;
    throw error;
  });

const refundRoom = async (room, reason) => {
  for (const player of room.players) {
    const locked = Number(room.lockedBets.get(String(player.userId)) || 0);
    if (!locked) continue;

    await createTransaction({
      userId: player.userId,
      type: "ludo_bet_refund",
      amount: locked,
      coins: locked,
      walletType: "inactive",
      status: "success",
      reference: `ludo_refund_${room.roomId}_${player.userId}`,
      description: "Ludo bet released",
      metadata: { roomId: room.roomId, reason },
    });
  }
};

const finishRoom = async (room, winnerColor) => {
  if (room.status === "finished") return;

  const winner = room.players.find((player) => player.color === winnerColor);
  if (!winner) return;

  const betAmount = Number(room.betAmount || 0);
  const pot = betAmount * 2;
  const platformFee = 0;
  const payout = betAmount * 2;

  const creditedWinner = await User.findOneAndUpdate(
    {
      _id: winner.userId,
      $expr: { $gte: [inactiveCoinsExpression, betAmount] },
    },
    [
      {
        $set: {
          "wallet.inactiveCoins": { $subtract: [inactiveCoinsExpression, betAmount] },
          "wallet.activeCoins": { $add: [activeCoinsExpression, payout] },
          "wallet.coins": { $add: [activeCoinsExpression, payout] },
          "wallet.balance": { $add: [activeCoinsExpression, payout] },
        },
      },
    ],
    { new: true },
  ).select("wallet");

  if (!creditedWinner) return;

  await createTransaction({
    userId: winner.userId,
    type: "bet_conversion",
    amount: betAmount,
    coins: betAmount,
    walletType: "inactive",
    status: "success",
    reference: `ludo_conversion_${room.roomId}_${winner.userId}`,
    description: "Ludo bet converted from inactive coins",
    metadata: { roomId: room.roomId },
  });

  await createTransaction({
    userId: winner.userId,
    type: "game_winnings",
    amount: payout,
    coins: payout,
    walletType: "active",
    status: "success",
    reference: `ludo_prize_${room.roomId}_${winner.userId}`,
    description: "Ludo match prize",
    metadata: { roomId: room.roomId, pot, platformFee, wallet: getWalletSnapshot(creditedWinner) },
  });

  const players = room.players.map((player) => ({
    userId: player.userId,
    username: player.username,
    color: player.color,
    betAmount: room.lockedBets.get(String(player.userId)) || room.betAmount,
    result: sameId(player.userId, winner.userId) ? "won" : "lost",
    payout: sameId(player.userId, winner.userId) ? payout : 0,
  }));

  await LudoMatch.findOneAndUpdate(
    { roomId: room.roomId },
    {
      roomId: room.roomId,
      players,
      betAmount: room.betAmount,
      pot,
      platformFee,
      winnerUserId: winner.userId,
      winnerColor,
      status: "finished",
      finishedAt: new Date(),
    },
    { upsert: true, new: true },
  );

  await Promise.all(
    players.map((player) =>
      LudoMatchPlayer.findOneAndUpdate(
        { roomId: room.roomId, userId: player.userId },
        { $set: { ...player, roomId: room.roomId } },
        { upsert: true },
      ),
    ),
  );

  room.status = "finished";
  room.winnerUserId = winner.userId;
  room.winnerColor = winnerColor;
  room.finishedAt = new Date();
  room.result = { pot, payout, platformFee };
};

const startMatch = async (room) => {
  if (!["waiting", "countdown"].includes(room.status)) return;
  ensureBoard(room);
  room.status = "active";
  room.countdownEndsAt = null;
  startTurn(room, room.players[0].color);

  await LudoMatch.findOneAndUpdate(
    { roomId: room.roomId },
    {
      roomId: room.roomId,
      players: room.players.map((player) => ({
        userId: player.userId,
        username: player.username,
        color: player.color,
        betAmount: room.lockedBets.get(String(player.userId)) || room.betAmount,
      })),
      betAmount: room.betAmount,
      pot: room.pot,
      status: "active",
      startedAt: new Date(),
    },
    { upsert: true, new: true },
  );
};

const maybeStartCountdown = (room) => {
  if (room.status !== "waiting" || room.players.length < room.minPlayers) return;
  room.status = "countdown";
  room.countdownEndsAt = new Date(Date.now() + 5000);
};

const handleExpiredTurn = async (room) => {
  if (room.status !== "active" || !room.turnDeadlineAt) return false;
  if (room.turnDeadlineAt.getTime() > Date.now()) return false;

  const player = room.players.find((item) => item.color === room.currentTurn);
  if (player) {
    await LudoMoveHistory.create({
      roomId: room.roomId,
      userId: player.userId,
      color: player.color,
      type: "skip",
      dice: room.lastDice,
      metadata: { reason: "turn_timeout" },
    });
  }

  advanceTurn(room);
  return true;
};

const startRoomTimer = (io, roomId) => {
  if (timersByRoom.has(roomId)) return;

  const interval = setInterval(() => {
    withRoomLock(roomId, async () => {
      const room = await LudoRoom.findOne({ roomId });
      if (!room || ["finished", "cancelled"].includes(room.status)) {
        clearInterval(interval);
        timersByRoom.delete(roomId);
        return;
      }

      if (room.status === "countdown" && room.countdownEndsAt?.getTime() <= Date.now()) {
        await startMatch(room);
      }

      await handleExpiredTurn(room);
      await room.save();
      emitRoom(io, roomId, "ludo_state", room);
    }).catch(() => undefined);
  }, 1000);

  timersByRoom.set(roomId, interval);
};

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.data.userId = getSocketUserId(socket);

    socket.on("join_room", async ({ roomId } = {}) => {
      if (!socket.data.userId) {
        socket.emit("ludo_error", { message: "Authentication required" });
        return;
      }

      if (!roomId) {
        socket.emit("ludo_error", { message: "roomId is required" });
        return;
      }

      try {
        await withRoomLock(roomId, async () => {
          const room = await LudoRoom.findOne({ roomId });
          if (!room) {
            socket.emit("ludo_error", { message: "Room not found" });
            return;
          }

          const existing = room.players.find((player) => sameId(player.userId, socket.data.userId));

          if (existing) {
            existing.socketId = socket.id;
            existing.online = true;
            existing.disconnectedAt = null;
          } else {
            if (room.status !== "waiting") {
              socket.emit("ludo_error", { message: "Match already started" });
              return;
            }

            if (room.players.length >= room.maxPlayers) {
              socket.emit("ludo_error", { message: "Room is full" });
              return;
            }

            const user = await User.findById(socket.data.userId).select(
              "username firstName lastName avatar",
            );
            if (!user) {
              socket.emit("ludo_error", { message: "User not found" });
              return;
            }

            const color = COLORS.find(
              (item) => !room.players.some((player) => player.color === item),
            );

            room.players.push({
              userId: user._id,
              socketId: socket.id,
              username: user.username,
              name: getDisplayName(user),
              avatar: user.avatar || "",
              color,
              online: true,
            });
            room.lockedBets.set(String(user._id), room.betAmount);
            room.pot = Number(room.pot || 0) + Number(room.betAmount);
          }

          maybeStartCountdown(room);
          await room.save();

          socket.data.ludoRoomId = roomId;
          socket.join(getRoomName(roomId));
          emitRoom(io, roomId, "ludo_state", room);
          startRoomTimer(io, roomId);
        });
      } catch {
        socket.emit("ludo_error", { message: "Unable to join room" });
      }
    });

    socket.on("create_room", () => {
      socket.emit("ludo_error", {
        message: "Create rooms through the Ludo lobby so wallet bets can be locked.",
      });
    });

    socket.on("reconnect_player", async ({ roomId } = {}) => {
      if (!roomId || !socket.data.userId) return;

      await withRoomLock(roomId, async () => {
        const room = await LudoRoom.findOne({ roomId });
        if (!room) return;

        const player = room.players.find((item) => sameId(item.userId, socket.data.userId));
        if (!player) return;

        player.socketId = socket.id;
        player.online = true;
        player.disconnectedAt = null;
        socket.data.ludoRoomId = roomId;
        socket.join(getRoomName(roomId));

        await room.save();
        emitRoom(io, roomId, "ludo_state", room);
        startRoomTimer(io, roomId);
      }).catch(() => undefined);
    });

    socket.on("start_match", async ({ roomId } = {}) => {
      if (!roomId || !socket.data.userId) return;

      await withRoomLock(roomId, async () => {
        const room = await LudoRoom.findOne({ roomId });
        if (!room || !sameId(room.createdBy, socket.data.userId)) return;
        if (room.players.length < room.minPlayers || room.status !== "waiting") return;

        await startMatch(room);
        await room.save();
        emitRoom(io, roomId, "ludo_state", room);
        startRoomTimer(io, roomId);
      }).catch(() => undefined);
    });

    socket.on("roll_dice", async ({ roomId } = {}) => {
      if (!roomId || !socket.data.userId) return;

      await withRoomLock(roomId, async () => {
        const room = await LudoRoom.findOne({ roomId });
        if (!room || room.status !== "active") return;
        if (room.diceRolledBy || room.mustMove) return;

        await handleExpiredTurn(room);
        const player = room.players.find((item) => sameId(item.userId, socket.data.userId));
        if (!player || player.color !== room.currentTurn) return;

        const dice = Math.floor(Math.random() * 6) + 1;
        const legalTokenIds = getLegalTokenIds(room, player.color, dice);

        room.lastDice = dice;
        room.diceRolledBy = String(player.userId);
        room.mustMove = legalTokenIds.length > 0;

        await LudoMoveHistory.create({
          roomId,
          userId: player.userId,
          color: player.color,
          type: "roll",
          dice,
          metadata: { legalTokenIds },
        });

        if (!legalTokenIds.length) {
          advanceTurn(room);
        } else {
          room.turnDeadlineAt = new Date(Date.now() + (room.turnSeconds || 25) * 1000);
        }

        await room.save();
        emitRoom(io, roomId, "dice_rolled", room, { dice, legalTokenIds });
      }).catch(() => undefined);
    });

    socket.on("move_piece", async ({ roomId, tokenId } = {}) => {
      if (!roomId || tokenId === undefined || !socket.data.userId) return;

      await withRoomLock(roomId, async () => {
        const room = await LudoRoom.findOne({ roomId });
        if (!room || room.status !== "active" || !room.mustMove || !room.lastDice) return;

        await handleExpiredTurn(room);
        const player = room.players.find((item) => sameId(item.userId, socket.data.userId));
        if (!player || player.color !== room.currentTurn) return;
        if (!sameId(room.diceRolledBy, player.userId)) return;

        const legalTokenIds = getLegalTokenIds(room, player.color, room.lastDice);
        if (!legalTokenIds.includes(Number(tokenId))) return;

        const tokens = room.board.get(player.color) || getInitialTokens();
        const token = tokens.find((item) => item.id === Number(tokenId));
        if (!token) return;

        const from = token.progress;
        token.progress = token.progress < 0 ? 0 : token.progress + room.lastDice;
        let killed = [];

        const landingIndex = getBoardIndex(player.color, token.progress);
        if (landingIndex !== null && !SAFE_SQUARES.has(landingIndex)) {
          for (const opponent of room.players.filter((item) => item.color !== player.color)) {
            const opponentTokens = room.board.get(opponent.color) || [];
            for (const opponentToken of opponentTokens) {
              if (getBoardIndex(opponent.color, opponentToken.progress) === landingIndex) {
                killed.push({ color: opponent.color, tokenId: opponentToken.id });
                opponentToken.progress = -1;
              }
            }
            room.board.set(opponent.color, opponentTokens);
          }
        }

        room.board.set(player.color, tokens);

        await LudoMoveHistory.create({
          roomId,
          userId: player.userId,
          color: player.color,
          type: "move",
          dice: room.lastDice,
          tokenId: Number(tokenId),
          from,
          to: token.progress,
          metadata: { killed },
        });

        if (killed.length) {
          await LudoMoveHistory.create({
            roomId,
            userId: player.userId,
            color: player.color,
            type: "kill",
            dice: room.lastDice,
            tokenId: Number(tokenId),
            metadata: { killed },
          });
        }

        if (tokens.every((item) => item.progress >= FINISHED_PROGRESS)) {
          await LudoMoveHistory.create({
            roomId,
            userId: player.userId,
            color: player.color,
            type: "finish",
          });
          await finishRoom(room, player.color);
        } else {
          advanceTurn(room, room.lastDice === 6 || killed.length > 0);
        }

        await room.save();
        emitRoom(io, roomId, "piece_moved", room, {
          move: { color: player.color, tokenId: Number(tokenId), from, to: token.progress, killed },
        });

        if (room.status === "finished") {
          emitRoom(io, roomId, "game_finished", room);
        }
      }).catch(() => undefined);
    });

    socket.on("next_turn", async ({ roomId } = {}) => {
      if (!roomId || !socket.data.userId) return;

      await withRoomLock(roomId, async () => {
        const room = await LudoRoom.findOne({ roomId });
        if (!room || room.status !== "active") return;
        await handleExpiredTurn(room);
        await room.save();
        emitRoom(io, roomId, "ludo_state", room);
      }).catch(() => undefined);
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.ludoRoomId;
      if (!roomId || !socket.data.userId) return;

      withRoomLock(roomId, async () => {
        const room = await LudoRoom.findOne({ roomId });
        if (!room) return;

        const player = room.players.find((item) => sameId(item.userId, socket.data.userId));
        if (!player || player.socketId !== socket.id) return;

        player.online = false;
        player.disconnectedAt = new Date();

        if (room.status === "waiting" && sameId(room.createdBy, socket.data.userId)) {
          room.status = "cancelled";
          room.cancelledAt = new Date();
          await refundRoom(room, "creator_disconnected_before_start");
        }

        await room.save();
        emitRoom(io, roomId, "player_disconnected", room, {
          disconnectedUserId: socket.data.userId,
        });
      }).catch(() => undefined);
    });
  });
};
