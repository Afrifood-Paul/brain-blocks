const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const {
    firstName,
    lastName,
    username,
    email,
    password,
    dob,
    phone,
  } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        msg: "Email already exists",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      passwordHash: hashed,
      dob,
      phone,
    });

    res.status(201).json({
      msg: "User created successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  // if (!user) return res.status(400).json({ msg: "User not found" });
  if (!user) {
  return res.status(404).json({ msg: "Account does not exist. Please register." });
}

  const match = await bcrypt.compare(password, user.passwordHash);

  if (!match) return res.status(400).json({ msg: "Incorrect password or email" });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
   user.password = undefined;

  res.json({ token, user });
};


