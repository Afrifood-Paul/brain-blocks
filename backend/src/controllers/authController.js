const User = require("../models/User");
const Transaction = require("../models/Transaction");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SIGNUP_BONUS_COINS = 5000;
const REFERRAL_BONUS_COINS = 100;

const buildReferralPrefix = (firstName, username) => {
  const source = String(username || firstName || "BRAIN")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 5);

  return source || "BRAIN";
};

const generateReferralCode = async (firstName, username) => {
  const prefix = buildReferralPrefix(firstName, username);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = Math.floor(100 + Math.random() * 9000);
    const referralCode = `${prefix}${suffix}`;
    const existing = await User.exists({ referralCode });

    if (!existing) {
      return referralCode;
    }
  }

  return `${prefix}${Date.now().toString().slice(-6)}`;
};

const buildUsername = async (username, email) => {
  const base = String(username || email?.split("@")[0] || "player")
    .replace(/[^a-z0-9_]/gi, "")
    .slice(0, 18)
    .toLowerCase();
  const prefix = base || "player";

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = attempt === 0 ? prefix : `${prefix}${Math.floor(100 + Math.random() * 9000)}`;
    const existing = await User.exists({ username: candidate });

    if (!existing) return candidate;
  }

  return `${prefix}${Date.now().toString().slice(-5)}`;
};

exports.register = async (req, res) => {
  const { firstName, lastName, username, email, password, dob, phone, referralCode } = req.body;

  try {
    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();
    const cleanUsername = String(username || "").trim();

    if (!firstName || !lastName || !cleanEmail || !password) {
      return res
        .status(400)
        .json({ msg: "First name, last name, email, and password are required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const duplicateChecks = [{ email: cleanEmail }];
    if (cleanUsername) duplicateChecks.push({ username: cleanUsername });

    const existingUser = await User.findOne({ $or: duplicateChecks });
    if (existingUser) {
      return res.status(409).json({
        msg: existingUser.email === cleanEmail ? "Email already exists" : "Username already exists",
      });
    }

    const cleanReferralCode = String(referralCode || "")
      .trim()
      .toUpperCase();
    const referrer = cleanReferralCode
      ? await User.findOne({ referralCode: cleanReferralCode })
      : null;

    if (cleanReferralCode && !referrer) {
      return res.status(400).json({ msg: "Invalid referral code" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const avatar = req.file ? `/uploads/${req.file.filename}` : "";
    const finalUsername = await buildUsername(cleanUsername, cleanEmail);
    const newReferralCode = await generateReferralCode(firstName, finalUsername);

    const user = await User.create({
      firstName,
      lastName,
      username: finalUsername,
      email: cleanEmail,
      passwordHash: hashed,
      dob,
      phone,
      avatar,
      referralCode: newReferralCode,
      referredBy: referrer?._id || null,
      referralRewarded: false,
      wallet: {
        inactiveCoins: SIGNUP_BONUS_COINS,
        activeCoins: 0,
        coins: 0,
        balance: 0,
      },
    });

    await Transaction.create({
      userId: user._id,
      type: "welcome_bonus",
      amount: SIGNUP_BONUS_COINS,
      coins: SIGNUP_BONUS_COINS,
      walletType: "inactive",
      status: "success",
      reference: `welcome_bonus_${user._id}`,
      description: "Welcome bonus",
    });

    if (referrer && String(referrer._id) !== String(user._id)) {
      const creditedNewUser = await User.findOneAndUpdate(
        { _id: user._id, referralRewarded: false },
        { $set: { referralRewarded: true } },
        { new: true },
      );

      if (creditedNewUser) {
        const creditedReferrer = await User.findByIdAndUpdate(
          referrer._id,
          { $inc: { "wallet.inactiveCoins": REFERRAL_BONUS_COINS } },
          { new: true },
        );

        await Transaction.create({
          userId: creditedReferrer._id,
          type: "referral_bonus",
          amount: REFERRAL_BONUS_COINS,
          coins: REFERRAL_BONUS_COINS,
          walletType: "inactive",
          status: "success",
          reference: `referral_bonus_${creditedReferrer._id}_${user._id}`,
          description: "Referral signup bonus",
          referredUser: user._id,
          metadata: {
            referredUser: user._id,
          },
        });
      }
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    const safeUser = user.toObject();
    delete safeUser.passwordHash;

    res.status(201).json({
      msg: "User created successfully",
      token,
      user: safeUser,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        msg: "Account or referral code already exists",
      });
    }

    res.status(500).json({
      msg: "Server error",
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  // if (!user) return res.status(400).json({ msg: "User not found" });
  if (!user) {
    return res.status(404).json({ msg: "Account does not exist. Please register." });
  }

  const match = await bcrypt.compare(password, user.passwordHash);

  if (!match) return res.status(400).json({ msg: "Incorrect password or email" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  const safeUser = user.toObject();
  delete safeUser.passwordHash;

  res.json({ token, user: safeUser });
};
