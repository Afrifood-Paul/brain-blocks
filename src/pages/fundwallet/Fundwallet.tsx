import React, { useEffect, useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { formatCoins, useWallet } from "@/context/WalletContext";

const Fundwallet = () => {
  const navigate = useNavigate();
  const { coins, loading, error, fundWallet, verifyFunding } = useWallet();
  const [amount, setAmount] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<"paystack" | "opay">(
    "paystack"
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference =
      params.get("reference") ||
      params.get("trxref") ||
      params.get("orderNo");
    const provider =
      (params.get("provider") as "paystack" | "opay" | null) ||
      (reference?.includes("_paystack_") ? "paystack" : null) ||
      (reference?.includes("_opay_") ? "opay" : null) ||
      (params.get("trxref") ? "paystack" : null) ||
      (params.get("orderNo") ? "opay" : null);

    if (!reference || !provider) return;

    verifyFunding(provider, reference)
      .then(() => {
        setMessage("Wallet funded successfully");
        navigate({ to: "/fundwallet", replace: true });
      })
      .catch((err: any) => {
        setMessage(err.message || "Payment verification failed");
      });
  }, [navigate, verifyFunding]);

  const submitFunding = async (provider: "paystack" | "opay") => {
    const value = Number(amount);

    setMessage(null);
    setSelectedProvider(provider);

    if (!Number.isFinite(value) || value < 100) {
      setMessage("Enter at least 100 coins");
      return;
    }

    try {
      await fundWallet(provider, value);
    } catch (err: any) {
      setMessage(err.message || "Unable to start payment");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 pt-10 pb-16 flex justify-center">
      <div className="mx-auto w-full max-w-md">
        {/* Top Section */}
        <div className="flex items-center justify-between mb-6">
          <button className="bg-tab-active px-6 py-3 text-foreground border border-primary/60">
            Get Coins
          </button>

          <div className="text-right">
            <p className="text-sm text-gray-400">Coin Balance</p>
            <div className="flex items-center gap-2 justify-end">
              <span className="font-semibold">
                {showBalance ? formatCoins(coins) : "********"}
              </span>
              <button onClick={() => setShowBalance((value) => !value)}>
                {showBalance ? (
                  <Eye size={16} className="text-gray-400" />
                ) : (
                  <EyeOff size={16} className="text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown */}
        <div className="mb-4">
          <div className="flex items-center justify-between bg-[#9FC8F6] text-[#0B2177] px-6 py-5 rounded-full cursor-pointer">
            <span className="text-sm font-medium">
              {selectedProvider === "paystack"
                ? "Get coins with Paystack"
                : "Get coins with Opay"}
            </span>
            <ChevronDown size={18} />
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <input
            type="number"
            min="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Coin Amount"
            className="w-full bg-gray-200 text-black placeholder-gray-500 px-6 py-4 rounded-full outline-none"
          />
        </div>

        {(message || error) && (
          <p className="mb-4 text-sm text-red-300">{message || error}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            disabled={loading}
            onClick={() => submitFunding("paystack")}
            className="w-full bg-primary py-4 rounded-full font-semibold disabled:opacity-60"
          >
            {loading && selectedProvider === "paystack"
              ? "Please wait..."
              : "Pay with Paystack"}
          </button>

          <button
            disabled={loading}
            onClick={() => submitFunding("opay")}
            className="w-full bg-[#9FC8F6] py-4 rounded-full font-semibold text-[#0B2177] disabled:opacity-60"
          >
            {loading && selectedProvider === "opay"
              ? "Please wait..."
              : "Pay with Opay"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Fundwallet;
