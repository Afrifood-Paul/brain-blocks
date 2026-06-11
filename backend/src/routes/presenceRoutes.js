const router = require("express").Router();
const {
  getOnlineUsers,
  updatePresence,
  updatePresenceBeacon,
} = require("../controllers/presenceController");
const { requireAuth } = require("../middleware/auth");

router.get("/online", requireAuth, getOnlineUsers);
router.post("/presence", requireAuth, updatePresence);
router.post("/presence/beacon", updatePresenceBeacon);

module.exports = router;
