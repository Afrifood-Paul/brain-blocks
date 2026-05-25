const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { purchasePackage } = require("../controllers/purchaseController");

router.post("/", requireAuth, purchasePackage);

module.exports = router;
