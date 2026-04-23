import React from 'react'
import { useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";

const Withdrawal = () => {
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [showBalance, setShowBalance] = useState(false);

  return (
    <main className="min-h-screen bg-black text-white px-4 pt-12 pb-10">
      <div className="mx-auto w-full max-w-sm">
        {/* Top Tabs */}
        <div className="flex items-start justify-between">
          <button className="bg-tab-active px-6 py-3 text-foreground border border-primary/60">
            Withdrawal
          </button>

          <div className="text-right leading-tight">
            <p className="text-[14px] text-white font-medium">Wallet Balance</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {" "}
              {showBalance ? "₦128,390,00.00" : "••••••••••"}
            </p>
            <button
              type="button"
              onClick={() => setShowBalance(!showBalance)}
              className="text-white/80 hover:text-white transition"
            >
              {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Form */}
        <form className="mt-10 space-y-4">
          {/* Select Bank */}
          <div className="relative">
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="h-12 w-full appearance-none rounded-full bg-[#9FC8F6] px-5 pr-12 text-xs font-semibold text-[#1f3d68] outline-none border border-transparent focus:border-blue-500 transition"
            >
              <option value="">Select Bank</option>
              <option value="gtbank">GTBank</option>
              <option value="uba">UBA</option>
              <option value="access">Access Bank</option>
              <option value="zenith">Zenith Bank</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#244a7c]" />
          </div>

          {/* Account Number */}
          <div>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Account Number"
              className="h-12 w-full rounded-full bg-[#e7e7e7] px-5 text-xs text-black placeholder:text-gray-400 outline-none border border-transparent focus:border-blue-500 transition"
            />

            <p className="mt-1 pl-4 text-[10px] text-gray-400">Account Name Display</p>
          </div>

          {/* Amount */}
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Add Amount"
            className="h-12 w-full rounded-full bg-[#e7e7e7] px-5 text-xs text-black placeholder:text-gray-400 outline-none border border-transparent focus:border-blue-500 transition"
          />

          {/* Button */}
          <button
            type="submit"
            className="mt-3 h-12 w-full rounded-full bg-primary text-sm font-semibold text-white cursor-pointer"
          >
            Withdraw
          </button>
        </form>
      </div>
    </main>
  );
}


export default Withdrawal
