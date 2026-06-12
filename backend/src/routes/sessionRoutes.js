const router = require("express").Router();
const {
  deleteSession,
  getSessionById,
  getSessions,
  startSession,
} = require("../controllers/inviteController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, getSessions);
router.get("/:sessionId", requireAuth, getSessionById);
router.patch("/:sessionId/start", requireAuth, startSession);
router.delete("/:sessionId", requireAuth, deleteSession);

module.exports = router;
