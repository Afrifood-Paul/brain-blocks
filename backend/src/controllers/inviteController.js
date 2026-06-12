const Invite = require("../models/Invite");
const Notification = require("../models/Notification");
const User = require("../models/User");

const FIXED_INVITE_STAKE = 200;
const SESSION_STATUSES = ["pending", "accepted", "active", "completed", "declined"];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const cleanUsername = (username) =>
  String(username || "")
    .trim()
    .replace(/^@/, "");

const getAppOrigin = (req) => process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;

const parsePagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
};

const populateSession = (query) =>
  query
    .populate("inviterId", "username email isOnline lastActive avatar")
    .populate("invitedUserId", "username email isOnline lastActive avatar");

const serializePlayer = (player) => {
  if (!player || typeof player !== "object") return null;

  return {
    _id: player._id,
    username: player.username,
    email: player.email,
    avatar: player.avatar,
    isOnline: Boolean(player.isOnline),
    lastActive: player.lastActive,
  };
};

const serializeSession = (session) => {
  const doc = typeof session.toObject === "function" ? session.toObject() : session;
  const inviter = serializePlayer(doc.inviterId);
  const invitedUser = serializePlayer(doc.invitedUserId);

  return {
    ...doc,
    sessionId: doc._id,
    inviter: inviter || undefined,
    invitedUser: invitedUser || undefined,
    inviterId: inviter?._id || doc.inviterId,
    invitedUserId: invitedUser?._id || doc.invitedUserId,
    players: [inviter, invitedUser].filter(Boolean),
  };
};

const userSessionFilter = (userId) => ({
  $or: [{ inviterId: userId }, { invitedUserId: userId }],
});

const notifySessionUsers = async ({ session, actorId, title, message }) => {
  const recipients = [session.inviterId, session.invitedUserId]
    .filter(Boolean)
    .filter((userId) => String(userId) !== String(actorId));

  await Promise.all(
    recipients.map((userId) =>
      Notification.create({
        userId,
        type: "invite",
        title,
        message,
        inviteId: session._id,
      }),
    ),
  );
};

exports.createInvite = async (req, res) => {
  const { gameId, gameName, amount, invitedUsername } = req.body;
  const username = cleanUsername(invitedUsername);

  if (!gameId || !gameName || !username) {
    return res.status(400).json({ msg: "Game and invited username are required" });
  }

  if (Number(amount) !== FIXED_INVITE_STAKE) {
    return res.status(400).json({ msg: `Invite amount must be ${FIXED_INVITE_STAKE}` });
  }

  if (username === req.user.username) {
    return res.status(400).json({ msg: "You cannot invite yourself" });
  }

  const invitedUser = await User.findOne({ username });
  if (!invitedUser) {
    return res.status(404).json({ msg: "Invited user not found" });
  }

  const invite = await Invite.create({
    gameId,
    gameName,
    amount: FIXED_INVITE_STAKE,
    inviterId: req.user._id,
    invitedUserId: invitedUser._id,
    invitedUsername: username,
    inviteLink: `${getAppOrigin(req)}/invite/pending`,
  });

  invite.inviteLink = `${getAppOrigin(req)}/invite/${invite._id}`;
  await invite.save();

  await Notification.create({
    userId: invitedUser._id,
    type: "invite",
    title: "Game invite",
    message: `@${req.user.username} invited you to play ${gameName} for ₦${FIXED_INVITE_STAKE}.`,
    inviteId: invite._id,
  });

  res.status(201).json({ invite });
};

exports.getUserInvites = async (req, res) => {
  const { userId } = req.params;

  if (String(req.user._id) !== String(userId)) {
    return res.status(403).json({ msg: "You can only view your own invites" });
  }

  const invites = await Invite.find({
    $or: [{ inviterId: userId }, { invitedUserId: userId }],
  }).sort({ createdAt: -1 });

  res.json({ invites });
};

exports.getSessions = async (req, res) => {
  const { status, gameId } = req.query;
  const { page, limit, skip } = parsePagination(req.query);
  const filter = userSessionFilter(req.user._id);

  if (status) {
    if (!SESSION_STATUSES.includes(status)) {
      return res.status(400).json({ msg: "Invalid session status" });
    }
    filter.status = status;
  }

  if (gameId) {
    filter.gameId = String(gameId);
  }

  const [sessions, total] = await Promise.all([
    populateSession(Invite.find(filter)).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Invite.countDocuments(filter),
  ]);

  res.json({
    sessions: sessions.map(serializeSession),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

exports.getSessionById = async (req, res) => {
  const session = await populateSession(Invite.findById(req.params.sessionId));

  if (!session) {
    return res.status(404).json({ msg: "Session not found" });
  }

  const isPlayer =
    String(session.inviterId?._id || session.inviterId) === String(req.user._id) ||
    String(session.invitedUserId?._id || session.invitedUserId) === String(req.user._id);

  if (!isPlayer) {
    return res.status(403).json({ msg: "You can only view your own sessions" });
  }

  res.json({ session: serializeSession(session) });
};

exports.startSession = async (req, res) => {
  const session = await Invite.findById(req.params.sessionId);

  if (!session) {
    return res.status(404).json({ msg: "Session not found" });
  }

  const isPlayer =
    String(session.inviterId) === String(req.user._id) ||
    String(session.invitedUserId) === String(req.user._id);

  if (!isPlayer) {
    return res.status(403).json({ msg: "You can only start your own sessions" });
  }

  if (session.status !== "accepted") {
    return res.status(400).json({ msg: "Only accepted sessions can be started" });
  }

  if (!session.inviterId || !session.invitedUserId) {
    return res.status(400).json({ msg: "Both players must be present before starting" });
  }

  session.status = "active";
  session.startedAt = new Date();
  await session.save();

  await notifySessionUsers({
    session,
    actorId: req.user._id,
    title: "Game started",
    message: `@${req.user.username} started your ${session.gameName} game.`,
  });

  const populated = await populateSession(Invite.findById(session._id));
  res.json({ session: serializeSession(populated) });
};

exports.deleteSession = async (req, res) => {
  const session = await Invite.findById(req.params.sessionId);

  if (!session) {
    return res.status(404).json({ msg: "Session not found" });
  }

  const isPlayer =
    String(session.inviterId) === String(req.user._id) ||
    String(session.invitedUserId) === String(req.user._id);

  if (!isPlayer) {
    return res.status(403).json({ msg: "You can only delete your own sessions" });
  }

  const canDelete =
    session.status === "pending" || session.status === "accepted" || !session.startedAt;

  if (!canDelete) {
    return res.status(400).json({ msg: "Started sessions cannot be deleted" });
  }

  await Notification.deleteMany({ inviteId: session._id });
  await session.deleteOne();

  res.json({ success: true, sessionId: session._id });
};

const updateInviteStatus = async (req, res, status) => {
  const invite = await Invite.findById(req.params.id);

  if (!invite) {
    return res.status(404).json({ msg: "Invite not found" });
  }

  if (String(invite.invitedUserId) !== String(req.user._id)) {
    return res.status(403).json({ msg: "Only the invited user can respond to this invite" });
  }

  if (invite.status !== "pending") {
    return res.status(400).json({ msg: "Invite has already been updated" });
  }

  invite.status = status;
  await invite.save();

  await notifySessionUsers({
    session: invite,
    actorId: req.user._id,
    title: `Invite ${status}`,
    message: `@${req.user.username} ${status} your ${invite.gameName} invite.`,
  });

  const populated = await populateSession(Invite.findById(invite._id));
  const session = serializeSession(populated);

  res.json({ invite: session, session });
};

exports.acceptInvite = (req, res) => updateInviteStatus(req, res, "accepted");

exports.declineInvite = (req, res) => updateInviteStatus(req, res, "declined");
