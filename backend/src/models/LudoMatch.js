const mongoose = require("mongoose");

const matchPlayerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    color: { type: String, required: true },
    betAmount: { type: Number, required: true },
    result: {
      type: String,
      enum: ["pending", "won", "lost", "refunded"],
      default: "pending",
    },
    payout: { type: Number, default: 0 },
  },
  { _id: false },
);

const ludoMatchSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    players: { type: [matchPlayerSchema], default: [] },
    betAmount: { type: Number, required: true },
    pot: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    winnerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    winnerColor: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "finished", "cancelled"],
      default: "active",
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("LudoMatch", ludoMatchSchema);
