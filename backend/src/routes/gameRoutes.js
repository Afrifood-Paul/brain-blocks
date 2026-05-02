const router = require("express").Router();
const { createGame } = require("../controllers/gameController");
const { requireAuth } = require("../middleware/auth");

router.post("/create", requireAuth, createGame);

module.exports = router;
