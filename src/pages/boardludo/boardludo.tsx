import { Board } from "@/components/Ludo/Board";
import { useState } from "react";

const boardludo = () => {
  const [dice, setDice] = useState(0);

  const rollDice = () => {
    setDice(Math.floor(Math.random() * 6) + 1);
  };

  return (
    <div className="max-w-sm mx-auto space-y-5 mb-4 bg-black">
      {/* Top Ad */}
      <div className="h-36 bg-white flex items-center justify-center">
        <h1 className="text-xl font-bold text-black">Header Advert Placement Here</h1>
      </div>

      {/* Player 1 */}
      <div className="flex justify-between items-center px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-full bg-[#9FC8F6] border-4 border-[#008FF0] overflow-hidden sm:h-14 sm:w-14">
            <img src="https://i.pravatar.cc/80" alt="" className="h-full w-full object-cover" />
          </div>
          <span className="text-white text-xl font-bold">@Akinyemi</span>
        </div>

        <button onClick={rollDice} className="text-4xl text-white">
          🎲 {dice}
        </button>
      </div>

      {/* Ludo Board */}
      <div className="flex justify-center">
        <Board />
      </div>

      {/* Player 2 */}
      <div className="flex justify-between items-center px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-full bg-[#9FC8F6] border-4 border-[#008FF0] overflow-hidden sm:h-14 sm:w-14">
            <img src="https://i.pravatar.cc/81" alt="" className="h-full w-full object-cover" />
          </div>
          <span className="text-white text-xl font-bold">@Paul</span>
        </div>

        <button onClick={rollDice} className="text-4xl text-white">
          🎲 {dice}
        </button>
      </div>

      {/* Bottom Ad */}

      <div className="h-36 bg-white flex items-center justify-center">
        <h1 className="text-xl font-bold text-black"> Quarter Page Advert Placement Here</h1>
      </div>
    </div>
  );
};

export default boardludo;
