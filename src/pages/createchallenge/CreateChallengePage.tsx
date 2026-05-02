import React from 'react'
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { apiClient } from "@/services/api";

function CreateChallengePage() {
 const navigate = useNavigate();
 const [directChallenge, setDirectChallenge] = useState(false);
 const [gameType, setGameType] = useState("");
 const [amount, setAmount] = useState("");
 const [duration, setDuration] = useState("");
 const [opponentUsername, setOpponentUsername] = useState("");
 const [creating, setCreating] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [createdGame, setCreatedGame] = useState<{
   gameId: string;
   inviteLink: string;
 } | null>(null);

 const fullInviteLink =
   createdGame && typeof window !== "undefined"
     ? `${window.location.origin}${createdGame.inviteLink}`
     : createdGame?.inviteLink || "";

 const handleCreateGame = async () => {
   if (creating) return;

   setError(null);

   if (gameType !== "Chess" || !amount || !duration || duration === "Set Play Duration") {
     setError("Choose Chess, amount, and duration.");
     return;
   }

   if (directChallenge && !opponentUsername.trim()) {
     setError("Enter an opponent username.");
     return;
   }

   try {
     setCreating(true);
     const result = await apiClient.createGame({
       gameType,
       amount,
       duration,
       directChallenge,
       opponentUsername: opponentUsername.trim(),
     });

     setCreatedGame(result);
   } catch (err) {
     setError(err instanceof Error ? err.message : "Could not create game.");
   } finally {
     setCreating(false);
   }
 };

 const copyInviteLink = async () => {
   if (!fullInviteLink) return;
   await navigator.clipboard.writeText(fullInviteLink);
 };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        {/* Header Button */}
      <div className='flex justify-between items-center'>
          <button className="bg-tab-active px-6 py-3 text-foreground border border-primary/60">
          Create Challenge
        </button>

         <button onClick={() => navigate({ to: "/dashboard" })} className="bg-tab-active px-6 py-3 text-foreground border border-primary/60">
         Dashboard
        </button>
      </div>

        {/* Choose Game */}
        <div className="relative">
          <select
            value={gameType}
            onChange={(e) => setGameType(e.target.value)}
            className="w-full appearance-none bg-[#9FC8F6] text-[#0B2177] px-4 py-3 rounded-full outline-none"
          >
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
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Add Amount"
          className="w-full bg-white text-[#0B2177] px-4 py-3 rounded-full outline-none"
        />

        {/* Duration */}
        <div className="relative">
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full appearance-none bg-[#9FC8F6] text-[#0B2177] px-4 py-3 rounded-full outline-none"
          >
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
          value={opponentUsername}
          onChange={(e) => setOpponentUsername(e.target.value)}
          placeholder="@username"
          className="w-full bg-white text-black px-4 py-3 rounded-full outline-none"
        />

        {error && <p className="text-sm text-red-400 font-medium">{error}</p>}

        {/* Play Button */}
        <button
          onClick={handleCreateGame}
          disabled={creating}
          className="w-full bg-[#385FF4] text-white py-3 cursor-pointer rounded-full font-semibold"
        >
          {creating ? "Creating..." : "Play Game"}
        </button>

        {createdGame && (
          <div className="space-y-3 text-white text-sm">
            <input
              readOnly
              value={fullInviteLink}
              className="w-full bg-white text-black px-4 py-3 rounded-full outline-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={copyInviteLink}
                className="bg-[#9FC8F6] text-[#0B2177] py-3 rounded-full font-semibold"
              >
                Copy Link
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(fullInviteLink)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#9FC8F6] text-[#0B2177] py-3 rounded-full font-semibold text-center"
              >
                WhatsApp
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={`mailto:?subject=Chess Challenge&body=${encodeURIComponent(fullInviteLink)}`}
                className="bg-[#9FC8F6] text-[#0B2177] py-3 rounded-full font-semibold text-center"
              >
                Email
              </a>

              <button
                onClick={() => navigate({ to: createdGame.inviteLink })}
                className="bg-[#385FF4] text-white py-3 rounded-full font-semibold"
              >
                Join Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default CreateChallengePage
