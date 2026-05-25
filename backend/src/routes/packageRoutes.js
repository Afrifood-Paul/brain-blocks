const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { getPackages } = require("../controllers/packageController");

router.get("/", requireAuth, getPackages);

module.exports = router;
