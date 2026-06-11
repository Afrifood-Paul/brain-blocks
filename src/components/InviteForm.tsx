import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { DEFAULT_GAME_STAKE, GAMES, findGameById } from "@/constants/games";
import { apiClient, type Invite } from "@/services/api";
import { copyToClipboard } from "@/utils/copyToClipboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import dropdownIcon from "../assets/arrowdown.png";

type InviteFormProps = {
  selectedGameId?: string;
  onInviteCreated?: (invite: Invite) => void;
};

export default function InviteForm({ selectedGameId, onInviteCreated }: InviteFormProps) {
  const initialGameId = selectedGameId && findGameById(selectedGameId) ? selectedGameId : "ludo";
  const [game, setGame] = useState(initialGameId);
  const [amount, setAmount] = useState(DEFAULT_GAME_STAKE);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<Invite | null>(null);

  const selectedGame = useMemo(() => findGameById(game), [game]);

  useEffect(() => {
    setAmount(selectedGame?.stake || DEFAULT_GAME_STAKE);
  }, [selectedGame]);

  useEffect(() => {
    if (selectedGameId && findGameById(selectedGameId)) {
      setGame(selectedGameId);
    }
  }, [selectedGameId]);

  const handleSubmit = async () => {
    const cleanUsername = username.trim().replace(/^@/, "");

    if (!selectedGame) {
      toast.error("Choose a game");
      return;
    }

    if (!cleanUsername) {
      toast.error("Enter the username to invite");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.createInvite({
        gameId: selectedGame.id,
        gameName: selectedGame.name,
        amount,
        invitedUsername: cleanUsername,
      });

      setCreatedInvite(res.invite);
      setUsername("");
      onInviteCreated?.(res.invite);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create invite");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!createdInvite?.inviteLink) return;

    await copyToClipboard(createdInvite.inviteLink);
    toast.success("Invite link copied");
  };

  return (
    <>
      <div className="space-y-4">
        {/* GAME SELECT */}
        <div className="relative">
          <select
            value={game}
            onChange={(e) => setGame(e.target.value)}
            className="w-full appearance-none bg-[#9FC8F6] text-[#0B2177] rounded-full px-5 py-4 outline-none"
          >
            <option value="" className="hover:bg-red-800 font-semibold">
              Choose Game
            </option>
            {GAMES.map((gameOption) => (
              <option key={gameOption.id} value={gameOption.id} className="font-semibold">
                {gameOption.name}
              </option>
            ))}
          </select>

          {/* dropdown icon */}
          <img
            src={dropdownIcon}
            alt="dropdown icon"
            className="absolute right-5 top-1/2 -translate-y-1/2 w-2 h-2 pointer-events-none"
          />
        </div>

        {/* AMOUNT */}
        <input
          type="text"
          value={`₦${amount}`}
          readOnly
          placeholder="Amount"
          className="w-full bg-white text-gray-500 placeholder-gray-400 rounded-full px-5 py-4 outline-none"
        />

        {/* USERNAME */}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="@username"
          className="w-full bg-[#EDEDED] text-gray-500 placeholder-gray-400 rounded-full px-5 py-4 outline-none"
        />

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#385FF4] text-white font-semibold rounded-full py-4 transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending invite..." : "Invite your friend"}
        </button>
      </div>

      <Dialog
        open={Boolean(createdInvite)}
        onOpenChange={(open) => !open && setCreatedInvite(null)}
      >
        <DialogContent className="bg-white text-slate-950">
          <DialogHeader>
            <DialogTitle>Invite Successful</DialogTitle>
            <DialogDescription>
              {createdInvite
                ? `${createdInvite.gameName} invite sent to @${createdInvite.invitedUsername}.`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {createdInvite && (
            <div className="space-y-3 rounded bg-slate-100 p-3 text-sm">
              <p className="font-medium text-slate-800">{createdInvite.gameName}</p>
              <p className="break-all text-slate-600">{createdInvite.inviteLink}</p>
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={handleCopyInvite}
              className="rounded bg-[#0B2177] px-4 py-2 text-sm font-semibold text-white"
            >
              Copy invite link
            </button>
            <button
              type="button"
              onClick={() => setCreatedInvite(null)}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
