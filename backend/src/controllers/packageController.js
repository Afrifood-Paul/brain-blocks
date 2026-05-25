const Package = require("../models/Package");

const defaultPackages = [
  { network: "MTN", type: "airtime", name: "MTN Airtime 100", priceCoins: 100 },
  { network: "MTN", type: "airtime", name: "MTN Airtime 500", priceCoins: 500 },
  { network: "MTN", type: "data", name: "MTN 1GB Data", priceCoins: 300, dataSize: "1GB" },
  { network: "MTN", type: "data", name: "MTN 2GB Data", priceCoins: 600, dataSize: "2GB" },
  { network: "Airtel", type: "airtime", name: "Airtel Airtime 100", priceCoins: 100 },
  { network: "Airtel", type: "airtime", name: "Airtel Airtime 500", priceCoins: 500 },
  { network: "Airtel", type: "data", name: "Airtel 1GB Data", priceCoins: 300, dataSize: "1GB" },
  { network: "Airtel", type: "data", name: "Airtel 2GB Data", priceCoins: 600, dataSize: "2GB" },
  { network: "Glo", type: "airtime", name: "Glo Airtime 100", priceCoins: 100 },
  { network: "Glo", type: "airtime", name: "Glo Airtime 500", priceCoins: 500 },
  { network: "Glo", type: "data", name: "Glo 1GB Data", priceCoins: 300, dataSize: "1GB" },
  { network: "Glo", type: "data", name: "Glo 2GB Data", priceCoins: 600, dataSize: "2GB" },
  { network: "9mobile", type: "airtime", name: "9mobile Airtime 100", priceCoins: 100 },
  { network: "9mobile", type: "airtime", name: "9mobile Airtime 500", priceCoins: 500 },
  { network: "9mobile", type: "data", name: "9mobile 1GB Data", priceCoins: 300, dataSize: "1GB" },
  { network: "9mobile", type: "data", name: "9mobile 2GB Data", priceCoins: 600, dataSize: "2GB" },
];

const ensureDefaultPackages = async () => {
  const count = await Package.countDocuments();
  if (count > 0) return;

  await Package.insertMany(defaultPackages, { ordered: false }).catch((err) => {
    if (err.code !== 11000) throw err;
  });
};

exports.getPackages = async (req, res) => {
  try {
    await ensureDefaultPackages();

    const network = String(req.query.network || "").trim();
    const type = String(req.query.type || "").trim().toLowerCase();
    const filter = { active: true };

    if (network) filter.network = network;
    if (type) filter.type = type;

    const packages = await Package.find(filter)
      .sort({ network: 1, type: 1, priceCoins: 1 })
      .lean();

    res.json({ packages });
  } catch (err) {
    res.status(500).json({
      msg: err.message || "Unable to load packages",
    });
  }
};
