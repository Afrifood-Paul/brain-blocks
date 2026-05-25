const mongoose = require("mongoose");

const ludoMatchPlayerSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    color: { type: String, required: true },
    betAmount: { type: Number, required: true },
    payout: { type: Number, default: 0 },
    result: {
      type: String,
      enum: ["pending", "won", "lost", "refunded"],
      default: "pending",
    },
  },
  { timestamps: true }
);

ludoMatchPlayerSchema.index({ roomId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("LudoMatchPlayer", ludoMatchPlayerSchema);
