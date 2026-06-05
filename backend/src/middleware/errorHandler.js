const errorHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    msg: err.message || "Server error",
    message: err.message || "Server error",
  });
};

module.exports = { errorHandler };
