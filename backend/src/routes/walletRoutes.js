const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const {
  getBalance,
  getReferralSummary,
  getTransactions,
  initializeFunding,
  transferCoins,
  verifyFunding,
} = require("../controllers/walletController");

router.get("/balance", requireAuth, getBalance);
router.get("/transactions", requireAuth, getTransactions);
router.get("/referrals", requireAuth, getReferralSummary);
router.post("/fund", requireAuth, initializeFunding);
router.post("/verify", requireAuth, verifyFunding);
router.post("/transfer", requireAuth, transferCoins);

module.exports = router;
