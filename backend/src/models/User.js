



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

    avatar: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
