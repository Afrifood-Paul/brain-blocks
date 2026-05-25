const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      min: 0,
    },
    coins: {
      type: Number,
      min: 0,
    },
    type: {
      type: String,
      enum: [
        "funding",
        "bonus",
        "welcome_bonus",
        "referral_bonus",
        "coin_purchase",
        "marketplace_purchase",
        "game_spend",
        "ludo_bet_locked",
        "ludo_bet_refund",
        "ludo_prize",
        "ludo_platform_fee",
      ],
      default: "funding",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
      index: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["paystack", "opay"],
    },
    description: {
      type: String,
      default: "",
    },
    network: {
      type: String,
      default: "",
      index: true,
    },
    packageName: {
      type: String,
      default: "",
    },
    providerReference: {
      type: String,
      default: "",
    },
    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
