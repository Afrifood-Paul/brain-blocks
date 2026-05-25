const crypto = require("crypto");
const LudoRoom = require("../models/LudoRoom");
const LudoMatch = require("../models/LudoMatch");
const LudoMoveHistory = require("../models/LudoMoveHistory");
const { MAX_BET_AMOUNT, getWalletSnapshot } = require("../utils/wallet");

const DEFAULT_PLATFORM_FEE = Number(process.env.LUDO_PLATFORM_FEE_PERCENT || 5);
const DEFAULT_TURN_SECONDS = Number(process.env.LUDO_TURN_SECONDS || 25);

const getDisplayName = (user) =>
  `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username;

exports.createLudoRoom = async (req, res) => {
  const betAmount = Number(req.body.betAmount);
  const maxPlayers = Number(req.body.maxPlayers || 2);
  const turnSeconds = Number(req.body.turnSeconds || DEFAULT_TURN_SECONDS);

  if (!Number.isFinite(betAmount) || betAmount <= 0) {
    return res.status(400).json({ msg: "Enter a valid bet amount" });
  }

  if (betAmount > MAX_BET_AMOUNT) {
    return res.status(400).json({ msg: `Bet amount cannot exceed ${MAX_BET_AMOUNT} coins` });
  }

  if (![2, 3, 4].includes(maxPlayers)) {
    return res.status(400).json({ msg: "Ludo supports 2 to 4 players" });
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

    res.status(201).json({
      room,
      roomId,
      inviteLink: `/ludo?roomId=${roomId}`,
      ...getWalletSnapshot(req.user),
    });
  } catch (err) {
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
