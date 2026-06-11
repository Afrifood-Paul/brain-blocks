const router = require("express").Router();
const {
  acceptInvite,
  createInvite,
  declineInvite,
  getUserInvites,
} = require("../controllers/inviteController");
const { requireAuth } = require("../middleware/auth");

router.post("/", requireAuth, createInvite);
router.get("/:userId", requireAuth, getUserInvites);
router.patch("/:id/accept", requireAuth, acceptInvite);
router.patch("/:id/decline", requireAuth, declineInvite);

module.exports = router;
