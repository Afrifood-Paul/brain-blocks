const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const {
  createLudoRoom,
  getLudoHistory,
  getLudoMoves,
  getLudoRoom,
  getLudoRooms,
} = require("../controllers/ludoController");

router.get("/rooms", requireAuth, getLudoRooms);
router.get("/history", requireAuth, getLudoHistory);
router.get("/rooms/:roomId", requireAuth, getLudoRoom);
router.get("/rooms/:roomId/moves", requireAuth, getLudoMoves);
router.post("/rooms", requireAuth, createLudoRoom);

module.exports = router;
