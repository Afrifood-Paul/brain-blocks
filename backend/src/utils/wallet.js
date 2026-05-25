const MAX_BET_AMOUNT = 5000;

const toNumber = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const getActiveCoins = (user) =>
  toNumber(user?.wallet?.activeCoins ?? user?.wallet?.coins ?? user?.wallet?.balance ?? 0);

const getInactiveCoins = (user) => toNumber(user?.wallet?.inactiveCoins ?? 0);

const getWalletSnapshot = (user) => {
  const activeCoins = getActiveCoins(user);
  const inactiveCoins = getInactiveCoins(user);

  return {
    activeCoins,
    inactiveCoins,
    coins: activeCoins,
    balance: activeCoins,
  };
};

const activeCoinsExpression = {
  $ifNull: [
    "$wallet.activeCoins",
    { $ifNull: ["$wallet.coins", { $ifNull: ["$wallet.balance", 0] }] },
  ],
};

const inactiveCoinsExpression = {
  $ifNull: ["$wallet.inactiveCoins", 0],
};

module.exports = {
  MAX_BET_AMOUNT,
  activeCoinsExpression,
  inactiveCoinsExpression,
  getActiveCoins,
  getInactiveCoins,
  getWalletSnapshot,
};
