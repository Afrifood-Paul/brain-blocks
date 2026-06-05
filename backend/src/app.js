require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "*";

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/game", require("./routes/gameRoutes"));
app.use("/api/wallet", require("./routes/walletRoutes"));
app.use("/api/ludo", require("./routes/ludoRoutes"));
app.use("/api/marketplace", require("./routes/marketplaceRoutes"));
app.use("/api/packages", require("./routes/packageRoutes"));
app.use("/api/purchase", require("./routes/purchaseRoutes"));

app.use((req, res) => {
  res.status(404).json({ msg: "Route not found", message: "Route not found" });
});

app.use(errorHandler);

module.exports = app;
