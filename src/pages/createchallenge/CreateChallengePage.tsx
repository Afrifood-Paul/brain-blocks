import React from 'react'
import { ChevronDown } from "lucide-react";
import { useState } from "react";

function CreateChallengePage() {
 const [directChallenge, setDirectChallenge] = useState(false);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        {/* Header Button */}
        <button className="bg-tab-active px-6 py-3 text-foreground border border-primary/60">
          Create Challenge
        </button>

        {/* Choose Game */}
        <div className="relative">
          <select className="w-full appearance-none bg-[#9FC8F6] text-[#0B2177] px-4 py-3 rounded-full outline-none">
            <option>Choose Game</option>
            <option>Scramble</option>
            <option>Picture Puzzle</option>
            <option>Ludo</option>
             <option>Chess</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#244a7c]" />
        </div>

        {/* Amount */}
        <input
          type="number"
          placeholder="Add Amount"
          className="w-full bg-white text-[#0B2177] px-4 py-3 rounded-full outline-none"
        />

        {/* Duration */}
        <div className="relative">
          <select className="w-full appearance-none bg-[#9FC8F6] text-[#0B2177] px-4 py-3 rounded-full outline-none">
            <option>Set Play Duration</option>
            <option>5 mins</option>
            <option>10 mins</option>
            <option>30 mins</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#244a7c]" />
        </div>

        {/* Direct Challenge Toggle */}
        <div className="text-white text-sm space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={directChallenge}
              onChange={() => setDirectChallenge(!directChallenge)}
             className="h-5 w-5 appearance-none rounded-full border-2 border-[#9FC8F6] bg-accent-foreground checked:bg-[#9FC8F6] checked:border-[#9FC8F6] transition"
            />
            <span className="pl-2">Direct Challenge?</span>
          </div>

          <p className="text-xs text-gray-400">
            Choose this option if you have a particular player you want to play with
          </p>
        </div>

        {/* Username (conditional feel like UI suggests usage) */}
        <input
          type="text"
          placeholder="@username"
          className="w-full bg-white text-black px-4 py-3 rounded-full outline-none"
        />

        {/* Play Button */}
        <button className="w-full bg-[#385FF4] text-white py-3 cursor-pointer rounded-full font-semibold">
          Play Game
        </button>
      </div>
    </div>
  );
}
export default CreateChallengePage
