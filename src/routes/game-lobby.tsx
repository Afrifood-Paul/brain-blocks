import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "react-toastify";

import { DEFAULT_GAME_STAKE, findGameById } from "@/constants/games";
import { useAuth } from "@/context/AuthContext";
import { apiClient, type Invite, type OnlineUser } from "@/services/api";
import NotificationsBell from "@/components/NotificationsBell";
import InviteForm from "../components/InviteForm";
import { requireAuth } from "@/router/guards";
import { ProtectedRoute } from "@/router/ProtectedRoute";

export const Route = createFileRoute("/game-lobby")({
  validateSearch: (search: Record<string, unknown>) => ({
    gameId: typeof search.gameId === "string" ? search.gameId : undefined,
    gameName: typeof search.gameName === "string" ? search.gameName : undefined,
  }),
  beforeLoad: requireAuth,
  component: () => (
    <ProtectedRoute>
      <GameLobby />
    </ProtectedRoute>
  ),
});

const fallbackPlayers: OnlineUser[] = [
  { _id: "mock-akinyemi", username: "Akinyemi", email: "", isOnline: true },
  { _id: "mock-paul", username: "Paul", email: "", isOnline: false },
  { _id: "mock-david", username: "David", email: "", isOnline: true },
  { _id: "mock-blessing", username: "Blessing", email: "", isOnline: true },
];

const getUserId = (user: { _id?: string; id?: string } | null) => user?._id || user?.id || "";

export default function GameLobby() {
  const [activeTab, setActiveTab] = useState<"games" | "invite">("games");
  const { user } = useAuth();
  const userId = getUserId(user);
  const { gameId, gameName } = Route.useSearch();
  const selectedGame = useMemo(() => findGameById(gameId), [gameId]);
  const lobbyGame = selectedGame ?? {
    id: gameId || "ludo",
    name: gameName || "Ludo",
    stake: DEFAULT_GAME_STAKE,
  };
  // const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>(fallbackPlayers);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loadingOnlineUsers, setLoadingOnlineUsers] = useState(true);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const navigate = useNavigate();

  const loadInvites = useCallback(
    async (force = false) => {
      if (!userId) return;

      setLoadingInvites(true);
      try {
        const res = await apiClient.getInvites(userId, force);
        setInvites(res.invites || []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load invites");
      } finally {
        setLoadingInvites(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  // useEffect(() => {
  //   let active = true;

  //   const loadOnlineUsers = async () => {
  //     try {
  //       const res = await apiClient.getOnlineUsers(true);
  //       if (active && res.users?.length) {
  //         setOnlineUsers(res.users);
  //       }
  //     } catch {
  //       if (active) setOnlineUsers(fallbackPlayers);
  //     }
  //   };

  //   loadOnlineUsers();
  //   const interval = window.setInterval(loadOnlineUsers, 60000);

  //   return () => {
  //     active = false;
  //     window.clearInterval(interval);
  //   };
  // }, []);

  useEffect(() => {
    let active = true;

    const loadOnlineUsers = async () => {
      try {
        setLoadingOnlineUsers(true);

        const res = await apiClient.getOnlineUsers(true);

        if (active) {
          setOnlineUsers(res.users || []);
        }
      } catch (error) {
        if (active) {
          setOnlineUsers([]);
          console.error(error);
        }
      } finally {
        if (active) setLoadingOnlineUsers(false);
      }
    };

    loadOnlineUsers();

    const interval = window.setInterval(loadOnlineUsers, 60000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const updateInviteStatus = async (inviteId: string, action: "accept" | "decline") => {
    try {
      const res =
        action === "accept"
          ? await apiClient.acceptInvite(inviteId)
          : await apiClient.declineInvite(inviteId);

      setInvites((current) =>
        current.map((invite) => (invite._id === inviteId ? res.invite : invite)),
      );
      toast.success(action === "accept" ? "Invite accepted" : "Invite declined");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update invite");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="max-w-md mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="py-2 px-4 border border-[#0B2177] cursor-pointer bg-[#0B2177]"
          >
            Dashboard
          </button>
          <NotificationsBell userId={userId} />
        </div>

        {/* <section className="mb-5 rounded-3xl bg-[#111] p-5">
          <p className="text-xs uppercase tracking-wide text-[#9FC8F6]">Selected Game</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{lobbyGame.name}</h1>
              <p className="mt-1 text-sm text-gray-400">Fixed stake: ₦{lobbyGame.stake}</p>
            </div>
            <button
              onClick={() => setActiveTab("invite")}
              className="rounded-full bg-[#385FF4] px-4 py-2 text-xs font-semibold"
            >
              Invite
            </button>
          </div>
        </section> */}

        {/* Tabs */}
        <div className="grid grid-cols-2 border border-[#0B2177] overflow-hidden mb-6">
          <button
            onClick={() => setActiveTab("games")}
            className={`py-3 font-medium transition-colors ${
              activeTab === "games" ? "bg-[#0B2177] text-[#CBE8FF]" : "bg-[#121212] text-[#CBE8FF]"
            }`}
          >
            My Games
          </button>

          <button
            onClick={() => setActiveTab("invite")}
            className={`py-3 font-medium transition-colors ${
              activeTab === "invite" ? "bg-[#0B2177] text-[#CBE8FF]" : "bg-[#121212] text-[#CBE8FF]"
            }`}
          >
            Invite a Friend
          </button>
        </div>

        {/* GAMES TAB */}
        {activeTab === "games" && (
          <>
            {/* My Games Card */}
            <div className="bg-[#111] rounded-3xl p-6 mb-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Games</h2>
                {loadingInvites && <span className="text-xs text-gray-400">Loading...</span>}
              </div>

              <div>
                {invites.length ? (
                  invites.map((invite) => {
                    const isReceived = String(invite.invitedUserId || "") === String(userId);

                    return (
                      <GameRow
                        key={invite._id}
                        title={`${invite.gameName} vs @${invite.invitedUsername}`}
                        status={`${isReceived ? "Invitation received" : "Invitation sent"} - ${
                          invite.status
                        }`}
                        statusColor={
                          invite.status === "declined" ? "text-red-500" : "text-[#1688D1]"
                        }
                        action={
                          isReceived && invite.status === "pending" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateInviteStatus(invite._id, "accept")}
                                className="bg-[#47B312] px-4 py-1.5 rounded-full text-xs"
                              >
                                Accept
                              </button>

                              <button
                                onClick={() => updateInviteStatus(invite._id, "decline")}
                                className="bg-[#FF0000] px-4 py-1.5 rounded-full text-xs"
                              >
                                Decline
                              </button>
                            </div>
                          ) : undefined
                        }
                      />
                    );
                  })
                ) : (
                  <p className="rounded bg-black/30 p-4 text-center text-sm text-gray-400">
                    No game invites yet.
                  </p>
                )}
              </div>
            </div>

            {/* Online Players */}
            {/* <div className="bg-[#111] rounded-3xl p-6">
              <h2 className="text-2xl font-bold mb-6">Online Players</h2>

              {onlineUsers.map((onlineUser) => (
                <PlayerRow
                  key={onlineUser._id}
                  username={`@${onlineUser.username}`}
                  gamesPlayed="Ready to play"
                  status={onlineUser.isOnline ? "Online" : "Away"}
                  onInvite={() => setActiveTab("invite")}
                />
              ))}
            </div> */}

            <div className="bg-[#111] rounded-3xl p-6">
              <h2 className="text-2xl font-bold mb-6">Online Players</h2>

              {loadingOnlineUsers ? (
                <p className="text-sm text-gray-400">Loading online players...</p>
              ) : onlineUsers.length ? (
                onlineUsers.map((onlineUser) => (
                  <PlayerRow
                    key={onlineUser._id}
                    username={`@${onlineUser.username}`}
                    gamesPlayed="Ready to play"
                    status={onlineUser.isOnline ? "Online" : "Away"}
                    onInvite={() => setActiveTab("invite")}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-400">No online players found.</p>
              )}
            </div>
          </>
        )}

        {/* INVITE FRIEND TAB */}
        {activeTab === "invite" && (
          <div>
            <InviteForm selectedGameId={lobbyGame.id} onInviteCreated={() => loadInvites(true)} />
          </div>
        )}
      </div>
    </div>
  );
}

type GameRowProps = {
  title: string;
  status: string;
  statusColor: string;
  action?: ReactNode;
};

function GameRow({ title, status, statusColor, action }: GameRowProps) {
  return (
    <div className="flex items-center border-b border-gray-800 py-4 last:border-b-0">
      <p className="w-[35%] text-sm text-white truncate">{title}</p>

      <p className={`flex-1 text-xs italic truncate ${statusColor}`}>{status}</p>

      {action && <div className="ml-3 shrink-0">{action}</div>}
    </div>
  );
}

type PlayerRowProps = {
  username: string;
  gamesPlayed: string;
  status: string;
  onInvite?: () => void;
};

function PlayerRow({ username, gamesPlayed, status, onInvite }: PlayerRowProps) {
  return (
    <div className="flex items-center border-b border-gray-800 py-4 last:border-b-0">
      <span className="w-[30%] text-sm text-white truncate">{username}</span>

      <span className="w-[35%] text-xs text-gray-400 truncate">{gamesPlayed}</span>

      <span
        className={`w-[15%] text-xs ${status === "Online" ? "text-green-500" : "text-yellow-500"}`}
      >
        {status}
      </span>

      <div className="w-[20%] flex justify-end">
        <button
          onClick={onInvite}
          className="bg-[#1C1C1E] text-[#1688D1] px-4 py-1.5 rounded-full text-xs"
        >
          Invite
        </button>
      </div>
    </div>
  );
}
