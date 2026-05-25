const crypto = require("crypto");
const Package = require("../models/Package");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { activeCoinsExpression, getWalletSnapshot } = require("../utils/wallet");

exports.purchasePackage = async (req, res) => {
  const { packageId, userId } = req.body;
  const phoneNumber = String(req.body.phoneNumber || "").trim();

  if (!packageId) {
    return res.status(400).json({ msg: "Package is required" });
  }

  if (userId && String(userId) !== String(req.user._id)) {
    return res.status(403).json({ msg: "Cannot purchase for another user" });
  }

  try {
    const selectedPackage = await Package.findOne({
      _id: packageId,
      active: true,
    }).lean();

    if (!selectedPackage) {
      return res.status(404).json({ msg: "Package not found" });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        $expr: { $gte: [activeCoinsExpression, selectedPackage.priceCoins] },
      },
      [
        {
          $set: {
            "wallet.activeCoins": {
              $subtract: [activeCoinsExpression, selectedPackage.priceCoins],
            },
            "wallet.coins": { $subtract: [activeCoinsExpression, selectedPackage.priceCoins] },
            "wallet.balance": { $subtract: [activeCoinsExpression, selectedPackage.priceCoins] },
          },
        },
      ],
      { new: true },
    ).select("wallet");

    if (!user) {
      return res.status(400).json({ msg: "Insufficient active coins" });
    }

    const reference = `package_purchase_${crypto.randomUUID()}`;
    const transaction = await Transaction.create({
      userId: req.user._id,
      type: "marketplace_purchase",
      amount: selectedPackage.priceCoins,
      coins: selectedPackage.priceCoins,
      walletType: "active",
      status: "success",
      reference,
      description: `${selectedPackage.network} ${selectedPackage.name}`,
      network: selectedPackage.network,
      packageName: selectedPackage.name,
      metadata: {
        packageId: selectedPackage._id,
        network: selectedPackage.network,
        packageType: selectedPackage.type,
        packageName: selectedPackage.name,
        dataSize: selectedPackage.dataSize,
        phoneNumber,
      },
    });

    res.status(201).json({
      msg: "Package purchased successfully",
      ...getWalletSnapshot(user),
      transaction,
      package: selectedPackage,
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message || "Unable to complete purchase",
    });
  }
};
