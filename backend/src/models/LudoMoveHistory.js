const mongoose = require("mongoose");

const ludoMoveHistorySchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    color: { type: String, required: true },
    type: {
      type: String,
      enum: ["roll", "move", "skip", "kill", "finish"],
      required: true,
    },
    dice: { type: Number, default: null },
    tokenId: { type: Number, default: null },
    from: { type: Number, default: null },
    to: { type: Number, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

module.exports = mongoose.model("LudoMoveHistory", ludoMoveHistorySchema);
