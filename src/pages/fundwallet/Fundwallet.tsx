import React from 'react'
import { ChevronDown, Eye } from "lucide-react";

const Fundwallet = () => {
  return (
   <div className="min-h-screen bg-background text-foreground px-4 pt-10 pb-16 flex justify-center">
      <div className="mx-auto w-full max-w-md">

        {/* Top Section */}
        <div className="flex items-center justify-between mb-6">
          <button className="bg-tab-active px-6 py-3 text-foreground border border-primary/60">
            Fund Wallet
          </button>

          <div className="text-right">
            <p className="text-sm text-gray-400">Wallet Balance</p>
            <div className="flex items-center gap-2 justify-end">
              <span className="font-semibold">₦128,390,00.00</span>
              <Eye size={16} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Dropdown */}
        <div className="mb-4">
          <div className="flex items-center justify-between bg-[#9FC8F6] text-[#0B2177] px-6 py-5 rounded-full cursor-pointer">
            <span className="text-sm font-medium">
              Choose How you want to Fund your Wallet
            </span>
            <ChevronDown size={18} />
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Add Amount"
            className="w-full bg-gray-200 text-black placeholder-gray-500 px-6 py-4 rounded-full outline-none"
          />
        </div>

        {/* Proceed Button */}
        <button className="w-full  bg-primary py-4 rounded-full font-semibold">
          Proceed
        </button>
        
      </div>
    </div>
  )
}

export default Fundwallet


