const crypto = require("crypto");
const { Chess } = require("chess.js");
const Game = require("../models/Game");
const Transaction = require("../models/Transaction");
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

  const coinAmount = Number(amount);

  if (!Number.isFinite(coinAmount) || coinAmount <= 0) {
    return res.status(400).json({ msg: "Enter a valid coin amount" });
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
  const user = await User.findOneAndUpdate(
    {
      _id: req.user._id,
      $expr: {
        $gte: [
          { $ifNull: ["$wallet.coins", { $ifNull: ["$wallet.balance", 0] }] },
          coinAmount,
        ],
      },
    },
    [
      {
        $set: {
          "wallet.coins": {
            $subtract: [
              { $ifNull: ["$wallet.coins", { $ifNull: ["$wallet.balance", 0] }] },
              coinAmount,
            ],
          },
        },
      },
    ],
    { new: true }
  ).select("wallet");

  if (!user) {
    return res.status(400).json({ msg: "Insufficient coins" });
  }

  try {
    await Game.create({
      gameId,
      gameType,
      amount: coinAmount,
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

    await Transaction.create({
      userId: req.user._id,
      type: "game_spend",
      amount: coinAmount,
      coins: coinAmount,
      status: "success",
      reference: `game_spend_${gameId}`,
      description: `Game entry: ${gameType}`,
      metadata: {
        gameId,
        directChallenge,
      },
    });
  } catch (err) {
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "wallet.coins": coinAmount },
    }).catch(() => {});

    return res.status(500).json({ msg: "Unable to create game" });
  }

  const coins = user.wallet?.coins ?? user.wallet?.balance ?? 0;

  res.status(201).json({
    gameId,
    inviteLink: `/chess?gameId=${gameId}`,
    coins,
    balance: coins,
  });
};
