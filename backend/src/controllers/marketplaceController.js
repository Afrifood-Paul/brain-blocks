const crypto = require("crypto");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { activeCoinsExpression, getWalletSnapshot } = require("../utils/wallet");

const products = [
  {
    id: "mtn-airtime-500",
    name: "MTN Airtime",
    category: "Airtime",
    coins: 500,
    description: "Instant MTN airtime top-up paid with coins.",
  },
  {
    id: "airtel-airtime-500",
    name: "Airtel Airtime",
    category: "Airtime",
    coins: 500,
    description: "Airtel airtime voucher for everyday calls.",
  },
  {
    id: "airtel-data-1gb",
    name: "Airtel Data",
    category: "Data",
    coins: 1200,
    description: "1GB Airtel data bundle purchase request.",
  },
  {
    id: "mtn-data-1gb",
    name: "MTN Data",
    category: "Data",
    coins: 1200,
    description: "1GB MTN data bundle purchase request.",
  },
  {
    id: "headphones",
    name: "Headphones",
    category: "Tech Gadgets",
    coins: 8500,
    description: "Lightweight headphones for gaming and music.",
  },
  {
    id: "mouse",
    name: "Mouse",
    category: "Tech Gadgets",
    coins: 4200,
    description: "Responsive wireless mouse for daily use.",
  },
  {
    id: "keyboard",
    name: "Keyboard",
    category: "Tech Gadgets",
    coins: 7500,
    description: "Compact keyboard with smooth key travel.",
  },
  {
    id: "power-bank",
    name: "Power bank",
    category: "Tech Gadgets",
    coins: 11000,
    description: "Portable power bank for charging on the go.",
  },
];

const findProduct = (productId) => products.find((product) => product.id === productId);

exports.getProducts = async (req, res) => {
  const category = String(req.query.category || "")
    .trim()
    .toLowerCase();
  const search = String(req.query.search || "")
    .trim()
    .toLowerCase();

  const filtered = products.filter((product) => {
    const matchesCategory = !category || product.category.toLowerCase() === category;
    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search);

    return matchesCategory && matchesSearch;
  });

  res.json({
    products: filtered,
    categories: ["All", "Airtime", "Data", "Tech Gadgets"],
  });
};

exports.getProduct = async (req, res) => {
  const product = findProduct(req.params.productId);

  if (!product) {
    return res.status(404).json({ msg: "Product not found" });
  }

  res.json({ product });
};

exports.purchaseProduct = async (req, res) => {
  const product = findProduct(req.body.productId);
  const deliveryNote = String(req.body.deliveryNote || "").trim();

  if (!product) {
    return res.status(404).json({ msg: "Product not found" });
  }

  try {
    const user = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        $expr: {
          $gte: [activeCoinsExpression, product.coins],
        },
      },
      [
        {
          $set: {
            "wallet.activeCoins": { $subtract: [activeCoinsExpression, product.coins] },
            "wallet.coins": { $subtract: [activeCoinsExpression, product.coins] },
            "wallet.balance": { $subtract: [activeCoinsExpression, product.coins] },
          },
        },
      ],
      { new: true },
    ).select("wallet");

    if (!user) {
      return res.status(400).json({ msg: "Insufficient active coins" });
    }

    const reference = `marketplace_${crypto.randomUUID()}`;
    const transaction = await Transaction.create({
      userId: req.user._id,
      type: "marketplace_purchase",
      amount: product.coins,
      coins: product.coins,
      walletType: "active",
      status: "success",
      reference,
      description: `Marketplace purchase: ${product.name}`,
      metadata: {
        product,
        deliveryNote,
      },
    });

    res.status(201).json({
      msg: "Purchase successful",
      ...getWalletSnapshot(user),
      transaction,
      product,
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message || "Unable to complete purchase",
    });
  }
};
