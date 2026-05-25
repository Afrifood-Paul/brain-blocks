const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    network: {
      type: String,
      enum: ["MTN", "Airtel", "Glo", "9mobile"],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["airtime", "data"],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    priceCoins: {
      type: Number,
      required: true,
      min: 1,
    },
    dataSize: {
      type: String,
      default: "",
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

packageSchema.index({ network: 1, type: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Package", packageSchema);
