const User = require("../models/User");
const jwt = require("jsonwebtoken");

const parsePagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};


exports.getOnlineUsers = async (req, res) => {
  const { search } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { isOnline: true };

  if (search) {
    const term = String(search).trim();
    filter.$or = [
      { username: { $regex: term, $options: "i" } },
      { email: { $regex: term, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("username email isOnline lastActive currentGameId")
      .sort({ lastActive: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

exports.updatePresence = async (req, res) => {
  const updates = {
    isOnline: Boolean(req.body.isOnline),
    lastActive: new Date(),
  };

  // Only update the game filter when the caller explicitly sends it. General auth heartbeats
  // should not wipe the lobby/game-room specific currentGameId used by /users/online.
  if (Object.prototype.hasOwnProperty.call(req.body, "currentGameId")) {
    updates.currentGameId = req.body.currentGameId || null;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select(
    "username email isOnline lastActive currentGameId",
  );

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
