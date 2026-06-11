const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  const { userId } = req.params;

  if (String(req.user._id) !== String(userId)) {
    return res.status(403).json({ msg: "You can only view your own notifications" });
  }

  const notifications = await Notification.find({ userId })
    .populate("inviteId")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    notifications: notifications.map((notification) => {
      const doc = notification.toObject();
      doc.invite = doc.inviteId && typeof doc.inviteId === "object" ? doc.inviteId : undefined;
      doc.inviteId = doc.invite?._id || doc.inviteId;
      return doc;
    }),
  });
};

exports.markNotificationRead = async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({ msg: "Notification not found" });
  }

  if (String(notification.userId) !== String(req.user._id)) {
    return res.status(403).json({ msg: "You can only update your own notifications" });
  }

  notification.read = true;
  await notification.save();

  res.json({ notification });
};
