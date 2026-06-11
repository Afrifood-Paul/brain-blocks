const router = require("express").Router();
const { getNotifications, markNotificationRead } = require("../controllers/notificationController");
const { requireAuth } = require("../middleware/auth");

router.get("/:userId", requireAuth, getNotifications);
router.patch("/:id/read", requireAuth, markNotificationRead);

module.exports = router;
