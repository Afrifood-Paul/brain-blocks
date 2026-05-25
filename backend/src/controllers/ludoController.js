const crypto = require("crypto");
const LudoRoom = require("../models/LudoRoom");
const LudoMatch = require("../models/LudoMatch");
const LudoMoveHistory = require("../models/LudoMoveHistory");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const DEFAULT_PLATFORM_FEE = Number(process.env.LUDO_PLATFORM_FEE_PERCENT || 5);
const DEFAULT_TURN_SECONDS = Number(process.env.LUDO_TURN_SECONDS || 25);

const getWalletCoins = (user) => user.wallet?.coins ?? user.wallet?.balance ?? 0;

const getDisplayName = (user) =>
  `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username;

const lockCoins = async (userId, amount) => {
  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      $expr: {
        $gte: [
          { $ifNull: ["$wallet.coins", { $ifNull: ["$wallet.balance", 0] }] },
          amount,
        ],
      },
    },
    [
      {
        $set: {
          "wallet.coins": {
            $subtract: [
              { $ifNull: ["$wallet.coins", { $ifNull: ["$wallet.balance", 0] }] },
              amount,
            ],
          },
        },
      },
    ],
    { new: true }
  ).select("wallet");

  return user;
};

exports.createLudoRoom = async (req, res) => {
  const betAmount = Number(req.body.betAmount);
  const maxPlayers = Number(req.body.maxPlayers || 2);
  const turnSeconds = Number(req.body.turnSeconds || DEFAULT_TURN_SECONDS);

  if (!Number.isFinite(betAmount) || betAmount <= 0) {
    return res.status(400).json({ msg: "Enter a valid bet amount" });
  }

  if (![2, 3, 4].includes(maxPlayers)) {
    return res.status(400).json({ msg: "Ludo supports 2 to 4 players" });
  }

  const user = await lockCoins(req.user._id, betAmount);
  if (!user) {
    return res.status(400).json({ msg: "Insufficient coins" });
  }

  const roomId = crypto.randomUUID();

  try {
    const room = await LudoRoom.create({
      roomId,
      createdBy: req.user._id,
      betAmount,
      platformFeePercent: DEFAULT_PLATFORM_FEE,
      maxPlayers,
      minPlayers: 2,
      turnSeconds,
      players: [
        {
          userId: req.user._id,
          username: req.user.username,
          name: getDisplayName(req.user),
          avatar: req.user.avatar || "",
          color: "red",
        },
      ],
      lockedBets: {
        [String(req.user._id)]: betAmount,
      },
      pot: betAmount,
    });

    await Transaction.create({
      userId: req.user._id,
      type: "ludo_bet_locked",
      amount: betAmount,
      coins: betAmount,
      status: "success",
      reference: `ludo_lock_${roomId}_${req.user._id}`,
      description: "Ludo bet locked",
      metadata: { roomId },
    });

    res.status(201).json({
      room,
      roomId,
      inviteLink: `/ludo?roomId=${roomId}`,
      coins: getWalletCoins(user),
      balance: getWalletCoins(user),
    });
  } catch (err) {
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "wallet.coins": betAmount },
    }).catch(() => {});

    res.status(500).json({ msg: "Unable to create Ludo room" });
  }
};

exports.getLudoRooms = async (_req, res) => {
  const rooms = await LudoRoom.find({ status: { $in: ["waiting", "countdown"] } })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  res.json({ rooms });
};

exports.getLudoRoom = async (req, res) => {
  const room = await LudoRoom.findOne({ roomId: req.params.roomId }).lean();

  if (!room) {
    return res.status(404).json({ msg: "Room not found" });
  }

  res.json({ room });
};

exports.getLudoHistory = async (req, res) => {
  const matches = await LudoMatch.find({ "players.userId": req.user._id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  res.json({ matches });
};

exports.getLudoMoves = async (req, res) => {
  const room = await LudoRoom.findOne({
    roomId: req.params.roomId,
    "players.userId": req.user._id,
  }).select("roomId");

  if (!room) {
    return res.status(404).json({ msg: "Room not found" });
  }

  const moves = await LudoMoveHistory.find({ roomId: req.params.roomId })
    .sort({ createdAt: 1 })
    .limit(200)
    .lean();

  res.json({ moves });
};
