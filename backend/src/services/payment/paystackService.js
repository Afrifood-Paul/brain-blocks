const PAYSTACK_BASE_URL = "https://api.paystack.co";

const getSecretKey = () => process.env.PAYSTACK_SECRET_KEY;

const assertConfigured = () => {
  if (!getSecretKey()) {
    throw new Error("Paystack is not configured");
  }
};

const requestPaystack = async (path, options = {}) => {
  assertConfigured();

  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(data.message || "Paystack request failed");
  }

  return data;
};

const initializePaystackPayment = async ({
  email,
  amount,
  reference,
  callbackUrl,
}) => {
  const data = await requestPaystack("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100),
      reference,
      callback_url: callbackUrl,
    }),
  });

  return {
    authorizationUrl: data.data.authorization_url,
    providerReference: data.data.reference,
    raw: data.data,
  };
};

const verifyPaystackPayment = async (reference) => {
  const data = await requestPaystack(
    `/transaction/verify/${encodeURIComponent(reference)}`
  );

  return {
    success: data.data.status === "success",
    amount: data.data.amount / 100,
    reference: data.data.reference,
    raw: data.data,
  };
};

module.exports = {
  initializePaystackPayment,
  verifyPaystackPayment,
};
