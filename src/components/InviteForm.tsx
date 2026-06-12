import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { DEFAULT_GAME_STAKE, GAMES, findGameById } from "@/constants/games";
import { apiClient, type Invite } from "@/services/api";
import { copyToClipboard } from "@/utils/copyToClipboard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import dropdownIcon from "../assets/arrowdown.png";
import shareIcon from "../assets/shareReferralIcon.png";
import copyIcon from "../assets/copyrefferalIcon.png";

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

  // const handleCopyInvite = async () => {
  //   if (!createdInvite?.inviteLink) return;

  //   await copyToClipboard(createdInvite.inviteLink);
  //   toast.success("Invite link copied");
  // };

  const handleCopyInvite = async () => {
    if (!createdInvite?.inviteLink) {
      toast.error("No invite link available");
      return;
    }

    await copyToClipboard(createdInvite.inviteLink);
    toast.success("Invite link copied");
  };

  const handleShareInvite = async () => {
    if (!createdInvite?.inviteLink) {
      toast.error("No invite link available");
      return;
    }

    const shareData = {
      title: `${createdInvite.gameName} Invitation`,
      text: `Join my ${createdInvite.gameName} game!`,
      url: createdInvite.inviteLink,
    };

    // ❗ ONLY check support
    if (!navigator.share) {
      await copyToClipboard(createdInvite.inviteLink);
      toast.info("Sharing not supported. Link copied instead");
      return;
    }

    try {
      await navigator.share(shareData);
    } catch (err) {
      // User cancelled share → DO NOTHING
      if ((err as any)?.name === "AbortError") return;

      toast.error("Unable to share");
    }
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
        <DialogContent className="border-none bg-transparent shadow-none p-0 max-w-md">
          {/* Back Button */}
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => {
                setCreatedInvite(null);
                window.location.href = "/dashboard";
                // or navigate({ to: "/dashboard" })
              }}
              className="bg-[#0B2177] text-white px-6 py-3 text-sm font-medium"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Modal Card */}
          <div className="bg-[#111111] rounded-2xl px-7 py-8">
            <p className="text-white text-[18px] leading-9 font-normal">
              An invitation has been sent to your friend. They will receive it in their
              notifications.
              <br />
              You can also copy the link below to share it on WhatsApp.
            </p>

            {createdInvite && (
              <div className="mt-8 bg-[#B9D5F7] rounded-md px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-[#0B2177] text-xs truncate flex-1">{createdInvite.inviteLink}</p>

                <div className="flex items-center gap-2">
                  {/* Copy */}
                  <button onClick={handleCopyInvite} className="shrink-0">
                    <img src={copyIcon} alt="Copy" className="w-4 h-4" />
                  </button>

                  {/* Share */}
                  <button onClick={handleShareInvite} className="shrink-0">
                    <img src={shareIcon} alt="Share" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
