const Invite = require("../models/Invite");
const Notification = require("../models/Notification");
const User = require("../models/User");

const FIXED_INVITE_STAKE = 200;

const cleanUsername = (username) =>
  String(username || "")
    .trim()
    .replace(/^@/, "");

const getAppOrigin = (req) => process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;

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

  await Notification.create({
    userId: invite.inviterId,
    type: "invite",
    title: `Invite ${status}`,
    message: `@${req.user.username} ${status} your ${invite.gameName} invite.`,
    inviteId: invite._id,
  });

  res.json({ invite });
};

exports.acceptInvite = (req, res) => updateInviteStatus(req, res, "accepted");

exports.declineInvite = (req, res) => updateInviteStatus(req, res, "declined");
