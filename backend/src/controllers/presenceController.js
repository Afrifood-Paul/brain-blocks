const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.getOnlineUsers = async (req, res) => {
  const users = await User.find({ isOnline: true })
    .select("username email isOnline lastActive")
    .sort({ lastActive: -1 })
    .limit(50);

  res.json({ users });
};

exports.updatePresence = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      isOnline: Boolean(req.body.isOnline),
      lastActive: new Date(),
    },
    { new: true },
  ).select("username email isOnline lastActive");

  res.json({ user });
};

exports.updatePresenceBeacon = async (req, res) => {
  try {
    const decoded = jwt.verify(req.body.token, process.env.JWT_SECRET);

    await User.findByIdAndUpdate(decoded.id, {
      isOnline: Boolean(req.body.isOnline),
      lastActive: new Date(),
    });

    res.status(204).end();
  } catch {
    res.status(204).end();
  }
};
