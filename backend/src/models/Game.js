const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    userId: { type: String, default: null },
    socketId: { type: String, default: null },
    username: { type: String, default: null },
    name: { type: String, default: null },
    avatar: { type: String, default: null },
  },
  { _id: false }
);

const moveSchema = new mongoose.Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    promotion: { type: String, default: null },
    san: { type: String, required: true },
    color: { type: String, enum: ["w", "b"], required: true },
    fen: { type: String, required: true },
    movedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const gameSchema = new mongoose.Schema(
  {
    gameId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    players: {
      white: { type: playerSchema, default: null },
      black: { type: playerSchema, default: null },
    },
    gameType: { type: String, default: "Chess" },
    amount: { type: Number, default: 0 },
    duration: { type: Number, default: 600 },
    directChallenge: { type: Boolean, default: false },
    opponentUsername: { type: String, default: null },
    opponentUserId: { type: String, default: null },
    createdBy: { type: String, default: null },
    boardState: { type: String, required: true },
    moveHistory: { type: [moveSchema], default: [] },
    currentTurn: { type: String, enum: ["w", "b"], default: "w" },
    sharedTime: { type: Number, default: 600 },
    whiteTime: { type: Number, default: 600 },
    blackTime: { type: Number, default: 600 },
    timerStartedAt: { type: Date, default: null },
    lastTimerStartedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "checkmate", "draw", "abandoned"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Game", gameSchema);
