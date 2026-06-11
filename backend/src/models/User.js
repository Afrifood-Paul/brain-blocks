// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema(
//  {
//     firstName: { type: String, required: true },
//     lastName: { type: String, required: true },
//     username: { type: String, unique: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     dob: { type: Date },
//     phone: { type: String },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    dob: {
      type: Date,
    },

    phone: {
      type: String,
    },

    state: {
      type: String,
    },

    avatar: {
      type: String,
      default: "",
    },

    wallet: {
      inactiveCoins: { type: Number, default: 2000, min: 0 },
      activeCoins: { type: Number, default: 0, min: 0 },
      coins: { type: Number, default: 0 },
      balance: { type: Number },
    },

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    referralRewarded: {
      type: Boolean,
      default: false,
    },

    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },

    lastActive: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
