const crypto = require("crypto");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const {
  initializePaystackPayment,
  verifyPaystackPayment,
} = require("../services/payment/paystackService");
const { initializeOpayPayment, verifyOpayPayment } = require("../services/payment/opayService");
const { activeCoinsExpression, getWalletSnapshot } = require("../utils/wallet");

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

exports.getBalance = async (req, res) => {
  res.json(getWalletSnapshot(req.user));
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
      walletType: transaction.walletType || undefined,
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
  const callbackUrl = req.body.callbackUrl || `${process.env.FRONTEND_URL || ""}/fundwallet`;
  let transaction = null;

  try {
    transaction = await Transaction.create({
      userId: req.user._id,
      type: "funding",
      amount,
      coins: amount,
      walletType: "active",
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
      return res.json({
        msg: "Wallet already credited",
        ...getWalletSnapshot(user),
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
      { new: true },
    );

    if (!creditedTransaction) {
      const user = await User.findById(req.user._id).select("wallet");
      return res.json({
        msg: "Wallet already processed",
        ...getWalletSnapshot(user),
        transaction,
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      [
        {
          $set: {
            "wallet.activeCoins": { $add: [activeCoinsExpression, creditedTransaction.amount] },
            "wallet.coins": { $add: [activeCoinsExpression, creditedTransaction.amount] },
            "wallet.balance": { $add: [activeCoinsExpression, creditedTransaction.amount] },
          },
        },
      ],
      { new: true },
    ).select("wallet");

    res.json({
      msg: "Wallet funded successfully",
      ...getWalletSnapshot(user),
      transaction: creditedTransaction,
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message || "Unable to verify payment",
    });
  }
};

exports.transferCoins = async (req, res) => {
  const amount = normalizeAmount(req.body.amount);
  const recipient = String(req.body.recipient || req.body.receiver || "")
    .trim()
    .replace(/^@/, "");

  if (!recipient) {
    return res.status(400).json({ msg: "Recipient is required" });
  }

  if (amount <= 0) {
    return res.status(400).json({ msg: "Enter a valid transfer amount" });
  }

  const session = await User.startSession();

  try {
    let senderWallet = null;

    await session.withTransaction(async () => {
      const receiver = await User.findOne({
        $or: [
          { username: recipient },
          { email: recipient.toLowerCase() },
          { referralCode: recipient.toUpperCase() },
        ],
      })
        .select("_id username email wallet")
        .session(session);

      if (!receiver) {
        const error = new Error("Recipient not found");
        error.status = 404;
        throw error;
      }

      if (String(receiver._id) === String(req.user._id)) {
        const error = new Error("You cannot transfer coins to yourself");
        error.status = 400;
        throw error;
      }

      const sender = await User.findOneAndUpdate(
        {
          _id: req.user._id,
          $expr: { $gte: [activeCoinsExpression, amount] },
        },
        [
          {
            $set: {
              "wallet.activeCoins": { $subtract: [activeCoinsExpression, amount] },
              "wallet.coins": { $subtract: [activeCoinsExpression, amount] },
              "wallet.balance": { $subtract: [activeCoinsExpression, amount] },
            },
          },
        ],
        { new: true, session },
      ).select("wallet username");

      if (!sender) {
        const error = new Error("Insufficient active coins");
        error.status = 400;
        throw error;
      }

      const creditedReceiver = await User.findByIdAndUpdate(
        receiver._id,
        [
          {
            $set: {
              "wallet.activeCoins": { $add: [activeCoinsExpression, amount] },
              "wallet.coins": { $add: [activeCoinsExpression, amount] },
              "wallet.balance": { $add: [activeCoinsExpression, amount] },
            },
          },
        ],
        { new: true, session },
      ).select("wallet username");

      const reference = `coin_transfer_${crypto.randomUUID()}`;
      await Transaction.create(
        [
          {
            userId: req.user._id,
            type: "coin_transfer_sent",
            amount,
            coins: amount,
            walletType: "active",
            status: "success",
            reference: `${reference}_sender`,
            description: `Coin transfer to @${creditedReceiver.username}`,
            sender: req.user._id,
            receiver: creditedReceiver._id,
            metadata: { recipient: creditedReceiver.username },
          },
          {
            userId: creditedReceiver._id,
            type: "coin_transfer_received",
            amount,
            coins: amount,
            walletType: "active",
            status: "success",
            reference: `${reference}_receiver`,
            description: `Coin transfer from @${sender.username}`,
            sender: req.user._id,
            receiver: creditedReceiver._id,
            metadata: { sender: sender.username },
          },
        ],
        { session },
      );

      senderWallet = sender;
    });

    res.status(201).json({
      msg: "Coins transferred successfully",
      ...getWalletSnapshot(senderWallet),
    });
  } catch (err) {
    res.status(err.status || 500).json({
      msg: err.message || "Unable to transfer coins",
    });
  } finally {
    session.endSession();
  }
};
