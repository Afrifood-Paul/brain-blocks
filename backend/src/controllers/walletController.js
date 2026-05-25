const crypto = require("crypto");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const {
  initializePaystackPayment,
  verifyPaystackPayment,
} = require("../services/payment/paystackService");
const {
  initializeOpayPayment,
  verifyOpayPayment,
} = require("../services/payment/opayService");

const providers = {
  paystack: {
    initialize: initializePaystackPayment,
    verify: verifyPaystackPayment,
  },
  opay: {
    initialize: initializeOpayPayment,
    verify: verifyOpayPayment,
  },
};

const buildReferralPrefix = (firstName, username) => {
  const source = String(username || firstName || "BRAIN")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 5);

  return source || "BRAIN";
};

const generateReferralCode = async (user) => {
  const prefix = buildReferralPrefix(user.firstName, user.username);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = Math.floor(100 + Math.random() * 9000);
    const referralCode = `${prefix}${suffix}`;
    const existing = await User.exists({ referralCode });

    if (!existing) return referralCode;
  }

  return `${prefix}${Date.now().toString().slice(-6)}`;
};

const normalizeAmount = (amount) => {
  const value = Number(amount);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
};

const getWalletCoins = (user) => user.wallet?.coins ?? user.wallet?.balance ?? 0;

exports.getBalance = async (req, res) => {
  const coins = getWalletCoins(req.user);

  res.json({
    coins,
    balance: coins,
  });
};

exports.getTransactions = async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  res.json({
    transactions: transactions.map((transaction) => ({
      ...transaction,
      coins: transaction.coins ?? transaction.amount ?? 0,
    })),
  });
};

exports.getReferralSummary = async (req, res) => {
  let referralCode = req.user.referralCode || "";

  if (!referralCode) {
    referralCode = await generateReferralCode(req.user);
    await User.findByIdAndUpdate(req.user._id, { referralCode });
  }

  const [referrals, earned] = await Promise.all([
    User.countDocuments({ referredBy: req.user._id }),
    Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: "referral_bonus",
          status: "success",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ["$coins", "$amount"] } },
        },
      },
    ]),
  ]);

  res.json({
    referralCode,
    totalReferrals: referrals,
    totalReferralCoinsEarned: earned[0]?.total || 0,
  });
};

exports.initializeFunding = async (req, res) => {
  const provider = String(req.body.provider || "").toLowerCase();
  const amount = normalizeAmount(req.body.amount);

  if (!providers[provider]) {
    return res.status(400).json({ msg: "Invalid payment provider" });
  }

  if (amount < 100) {
    return res.status(400).json({ msg: "Amount must be at least 100" });
  }

  const reference = `wallet_${provider}_${crypto.randomUUID()}`;
  const callbackUrl =
    req.body.callbackUrl || `${process.env.FRONTEND_URL || ""}/fundwallet`;
  let transaction = null;

  try {
    transaction = await Transaction.create({
      userId: req.user._id,
      type: "funding",
      amount,
      coins: amount,
      reference,
      provider,
      status: "pending",
      description: "Get coins",
    });

    const initialized = await providers[provider].initialize({
      email: req.user.email,
      amount: transaction.amount,
      reference: transaction.reference,
      callbackUrl,
    });

    if (!initialized.authorizationUrl) {
      transaction.status = "failed";
      transaction.metadata = initialized.raw || {};
      await transaction.save();

      return res.status(502).json({
        msg: "Payment provider did not return a payment URL",
      });
    }

    transaction.providerReference = initialized.providerReference || "";
    transaction.metadata = initialized.raw || {};
    await transaction.save();

    res.status(201).json({
      authorizationUrl: initialized.authorizationUrl,
      reference: transaction.reference,
      provider,
    });
  } catch (err) {
    if (transaction && transaction.status === "pending") {
      transaction.status = "failed";
      transaction.metadata = {
        ...(transaction.metadata || {}),
        error: err.message,
      };
      await transaction.save().catch(() => {});
    }

    res.status(500).json({
      msg: err.message || "Unable to initialize payment",
    });
  }
};

exports.verifyFunding = async (req, res) => {
  const reference = req.body.reference;
  const provider = String(req.body.provider || "").toLowerCase();

  if (!reference || !providers[provider]) {
    return res.status(400).json({ msg: "Reference and provider are required" });
  }

  try {
    const transaction = await Transaction.findOne({
      reference,
      provider,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ msg: "Transaction not found" });
    }

    if (transaction.status === "success") {
      const user = await User.findById(req.user._id).select("wallet");
      const coins = getWalletCoins(user);
      return res.json({
        msg: "Wallet already credited",
        coins,
        balance: coins,
        transaction,
      });
    }

    const verified = await providers[provider].verify(reference);
    const verifiedAmount = Math.round(Number(verified.amount || 0) * 100) / 100;

    if (!verified.success || verifiedAmount < transaction.amount) {
      transaction.status = "failed";
      transaction.metadata = {
        ...(transaction.metadata || {}),
        verification: verified.raw,
      };
      await transaction.save();

      return res.status(400).json({ msg: "Payment verification failed" });
    }

    const creditedTransaction = await Transaction.findOneAndUpdate(
      {
        _id: transaction._id,
        status: "pending",
      },
      {
        $set: {
          status: "success",
          providerReference: verified.reference || transaction.providerReference,
          metadata: {
            ...(transaction.metadata || {}),
            verification: verified.raw,
          },
        },
      },
      { new: true }
    );

    if (!creditedTransaction) {
      const user = await User.findById(req.user._id).select("wallet");
      const coins = getWalletCoins(user);
      return res.json({
        msg: "Wallet already processed",
        coins,
        balance: coins,
        transaction,
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      [
        {
          $set: {
            "wallet.coins": {
              $add: [
                { $ifNull: ["$wallet.coins", { $ifNull: ["$wallet.balance", 0] }] },
                creditedTransaction.amount,
              ],
            },
          },
        },
      ],
      { new: true }
    ).select("wallet");

    const coins = getWalletCoins(user);

    res.json({
      msg: "Wallet funded successfully",
      coins,
      balance: coins,
      transaction: creditedTransaction,
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message || "Unable to verify payment",
    });
  }
};
