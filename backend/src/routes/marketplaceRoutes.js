const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const {
  getProduct,
  getProducts,
  purchaseProduct,
} = require("../controllers/marketplaceController");

router.get("/products", requireAuth, getProducts);
router.get("/products/:productId", requireAuth, getProduct);
router.post("/purchase", requireAuth, purchaseProduct);

module.exports = router;
