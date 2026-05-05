require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");


const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/game", require("./routes/gameRoutes"));

module.exports = app;
