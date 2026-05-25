const OPAY_BASE_URL =
  process.env.OPAY_BASE_URL || "https://sandboxapi.opaycheckout.com";

const getMerchantId = () => process.env.OPAY_MERCHANT_ID;
const getPrivateKey = () => process.env.OPAY_PRIVATE_KEY;

const assertConfigured = () => {
  if (!getMerchantId() || !getPrivateKey()) {
    throw new Error("Opay is not configured");
  }
};

const requestOpay = async (path, options = {}) => {
  assertConfigured();

  const response = await fetch(`${OPAY_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getPrivateKey()}`,
      MerchantId: getMerchantId(),
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Opay request failed");
  }

  return data;
};

const initializeOpayPayment = async ({
  email,
  amount,
  reference,
  callbackUrl,
}) => {
  const data = await requestOpay("/api/v1/international/cashier/create", {
    method: "POST",
    body: JSON.stringify({
      merchantId: getMerchantId(),
      reference,
      orderNo: reference,
      amount: {
        total: Math.round(amount * 100),
        currency: process.env.OPAY_CURRENCY || "NGN",
      },
      customer: {
        email,
      },
      returnUrl: callbackUrl,
      callbackUrl,
      product: {
        name: "Coin Purchase",
        description: "Get coins",
      },
    }),
  });

  const payload = data.data || data;

  return {
    authorizationUrl:
      payload.cashierUrl || payload.paymentUrl || payload.authorizationUrl,
    providerReference: payload.reference || payload.orderNo || reference,
    raw: payload,
  };
};

const verifyOpayPayment = async (reference) => {
  const data = await requestOpay("/api/v1/international/cashier/status", {
    method: "POST",
    body: JSON.stringify({
      merchantId: getMerchantId(),
      reference,
      orderNo: reference,
    }),
  });

  const payload = data.data || data;
  const status = String(payload.status || payload.orderStatus || "").toLowerCase();
  const paidAmount =
    payload.amount?.total ?? payload.amount ?? payload.totalAmount ?? 0;

  return {
    success: ["success", "successful", "paid", "completed"].includes(status),
    amount: Number(paidAmount) / 100,
    reference: payload.reference || payload.orderNo || reference,
    raw: payload,
  };
};

module.exports = {
  initializeOpayPayment,
  verifyOpayPayment,
};
