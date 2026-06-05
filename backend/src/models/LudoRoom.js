const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    socketId: { type: String, default: "" },
    username: { type: String, required: true },
    name: { type: String, default: "" },
    avatar: { type: String, default: "" },
    color: {
      type: String,
      enum: ["red", "green", "yellow", "blue"],
      required: true,
    },
    online: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
    disconnectedAt: { type: Date, default: null },
  },
  { _id: false },
);

const tokenSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    progress: { type: Number, default: -1 },
  },
  { _id: false },
);

const ludoRoomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    betAmount: { type: Number, required: true, min: 1 },
    platformFeePercent: { type: Number, default: 5 },
    maxPlayers: { type: Number, default: 2, min: 2, max: 4 },
    minPlayers: { type: Number, default: 2, min: 2, max: 4 },
    turnSeconds: { type: Number, default: 25, min: 10, max: 60 },
    status: {
      type: String,
      enum: ["waiting", "countdown", "active", "finished", "cancelled"],
      default: "waiting",
      index: true,
    },
    players: { type: [playerSchema], default: [] },
    lockedBets: { type: Map, of: Number, default: {} },
    pot: { type: Number, default: 0 },
    board: {
      type: Map,
      of: [tokenSchema],
      default: {},
    },
    currentTurn: {
      type: String,
      enum: ["red", "green", "yellow", "blue", null],
      default: null,
    },
    lastDice: { type: Number, default: null },
    diceRolledBy: { type: String, default: null },
    mustMove: { type: Boolean, default: false },
    turnStartedAt: { type: Date, default: null },
    turnDeadlineAt: { type: Date, default: null },
    countdownEndsAt: { type: Date, default: null },
    winnerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    winnerColor: {
      type: String,
      enum: ["red", "green", "yellow", "blue", null],
      default: null,
    },
    result: { type: mongoose.Schema.Types.Mixed, default: {} },
    finishedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("LudoRoom", ludoRoomSchema);
