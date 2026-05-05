const router = require("express").Router();
const { register, login } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { uploadAvatar } = require("../middleware/upload");

const handleAvatarUpload = (req, res, next) => {
  uploadAvatar.single("avatar")(req, res, (err) => {
    if (!err) return next();

    return res.status(400).json({
      msg: err.message || "Invalid avatar upload",
    });
  });
};

router.post("/register", handleAvatarUpload, register);
router.post("/login", login);


router.get("/me", requireAuth, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
