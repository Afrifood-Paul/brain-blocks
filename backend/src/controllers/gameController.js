const crypto = require("crypto");
const { Chess } = require("chess.js");
const Game = require("../models/Game");
const User = require("../models/User");

const parseDuration = (duration) => {
  if (typeof duration === "number") return duration * 60;

  const match = String(duration || "").match(/\d+/);
  return match ? Number(match[0]) * 60 : 600;
};

exports.createGame = async (req, res) => {
  const {
    gameType = "Chess",
    amount,
    duration,
    directChallenge = false,
    opponentUsername,
  } = req.body;

  if (gameType !== "Chess") {
    return res.status(400).json({ msg: "Only Chess challenges are supported" });
  }

  if (!amount || !duration) {
    return res.status(400).json({ msg: "Amount and duration are required" });
  }

  if (directChallenge && !opponentUsername?.trim()) {
    return res.status(400).json({ msg: "Opponent username is required" });
  }

  let opponent = null;
  const cleanOpponentUsername = opponentUsername?.trim().replace(/^@/, "");

  if (directChallenge) {
    opponent = await User.findOne({ username: cleanOpponentUsername });

    if (!opponent) {
      return res.status(404).json({ msg: "Opponent not found" });
    }

    if (String(opponent._id) === String(req.user._id)) {
      return res.status(400).json({ msg: "You cannot challenge yourself" });
    }
  }

  const gameId = crypto.randomUUID();
  const seconds = parseDuration(duration);

  await Game.create({
    gameId,
    gameType,
    amount: Number(amount),
    duration: seconds,
    directChallenge,
    opponentUsername: directChallenge ? cleanOpponentUsername : null,
    opponentUserId: opponent ? String(opponent._id) : null,
    createdBy: String(req.user._id),
    players: {
      white: {
        userId: String(req.user._id),
        socketId: null,
        username: req.user.username,
        name: `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() || req.user.username,
        avatar: req.user.avatar || "",
      },
      black: null,
    },
    boardState: new Chess().fen(),
    currentTurn: "w",
    sharedTime: seconds,
    whiteTime: seconds,
    blackTime: seconds,
    timerStartedAt: null,
    lastTimerStartedAt: null,
    status: "active",
  });

  res.status(201).json({
    gameId,
    inviteLink: `/chess?gameId=${gameId}`,
  });
};
