import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "react-toastify";

import NotificationsBell from "@/components/NotificationsBell";
import InviteForm from "@/components/InviteForm";
import { DEFAULT_GAME_STAKE, findGameById } from "@/constants/games";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/router/ProtectedRoute";
import { requireAuth } from "@/router/guards";
import {
  apiClient,
  type OnlineUser,
  type PaginationMeta,
  type Session,
  type SessionStatus,
} from "@/services/api";

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

const getUserId = (user: { _id?: string; id?: string } | null) => user?._id || user?.id || "";

const emptyPagination: PaginationMeta = {
  page: 1,
  limit: 5,
  total: 0,
  totalPages: 0,
};

const normalizeOnlineUsers = (users: OnlineUser[]) =>
  Array.from(new Map(users.map((onlineUser) => [onlineUser._id, onlineUser])).values());

export default function GameLobby() {
  const [activeTab, setActiveTab] = useState<"games" | "invite">("games");
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | "">("");
  const [sessionPage, setSessionPage] = useState(1);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsPagination, setSessionsPagination] = useState(emptyPagination);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [onlinePagination, setOnlinePagination] = useState(emptyPagination);
  const [onlinePage, setOnlinePage] = useState(1);
  const [onlineSearch, setOnlineSearch] = useState("");
  const [loadingOnlineUsers, setLoadingOnlineUsers] = useState(false);
  const { user } = useAuth();
  const userId = getUserId(user);
  const { gameId, gameName } = Route.useSearch();
  const selectedGame = useMemo(() => findGameById(gameId), [gameId]);
  const lobbyGame = selectedGame ?? {
    id: gameId || "ludo",
    name: gameName || "Ludo",
    stake: DEFAULT_GAME_STAKE,
  };
  const navigate = useNavigate();

  const loadSessions = useCallback(
    async (force = false) => {
      if (!userId) return;

      setLoadingSessions(true);
      try {
        const res = await apiClient.getSessions(
          {
            status: sessionStatus,
            gameId: lobbyGame.id,
            page: sessionPage,
            limit: 5,
          },
          force,
        );
        setSessions(res.sessions || []);
        setSessionsPagination(res.pagination || emptyPagination);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load sessions");
      } finally {
        setLoadingSessions(false);
      }
    },
    [lobbyGame.id, sessionPage, sessionStatus, userId],
  );

  const loadOnlineUsers = useCallback(
    async (force = false) => {
      setLoadingOnlineUsers(true);
      try {
        const res = await apiClient.getOnlineUsers(
          {
            search: onlineSearch,
            gameId: lobbyGame.id,
            page: onlinePage,
            limit: 5,
          },
          force,
        );
        setOnlineUsers(normalizeOnlineUsers(res.users || []));
        setOnlinePagination(res.pagination || emptyPagination);
      } catch (error) {
        setOnlineUsers([]);
        toast.error(error instanceof Error ? error.message : "Unable to load online players");
      } finally {
        setLoadingOnlineUsers(false);
      }
    },
    [lobbyGame.id, onlinePage, onlineSearch],
  );

  useEffect(() => {
    loadSessions(true);

    // Session state is backend-owned; poll less aggressively and pause while hidden.
    const refreshVisibleSessions = () => {
      if (!document.hidden) loadSessions(true);
    };
    const interval = window.setInterval(refreshVisibleSessions, 45000);
    document.addEventListener("visibilitychange", refreshVisibleSessions);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshVisibleSessions);
    };
  }, [loadSessions]);

  useEffect(() => {
    loadOnlineUsers(true);
    const interval = window.setInterval(() => loadOnlineUsers(true), 30000);
    return () => window.clearInterval(interval);
  }, [loadOnlineUsers]);

  useEffect(() => {
    apiClient.updatePresence(true, lobbyGame.id).catch(() => undefined);
    return () => {
      apiClient.updatePresence(true, null).catch(() => undefined);
    };
  }, [lobbyGame.id]);

  const updateInviteStatus = async (session: Session, action: "accept" | "decline") => {
    try {
      if (action === "accept") {
        const res = await apiClient.acceptInvite(session._id);
        const sessionId =
          res.session?.sessionId || res.session?._id || res.invite.sessionId || res.invite._id;
        toast.success("Invite accepted");
        navigate({ to: "/game-room/$sessionId", params: { sessionId } });
        return;
      }

      await apiClient.declineInvite(session._id);
      await loadSessions(true);
      toast.success("Invite declined");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update invite");
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await apiClient.deleteSession(sessionId);
      setSessions((current) => current.filter((session) => session._id !== sessionId));
      toast.success("Game deleted");
      await loadSessions(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete game");
    }
  };

  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="bg-[#0B2177] px-4 py-2 text-sm font-semibold"
          >
            Dashboard
          </button>
          <NotificationsBell userId={userId} />
        </div>

        <div className="mb-6 grid grid-cols-2 overflow-hidden border border-[#0B2177]">
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
            Invite
          </button>
        </div>

        {activeTab === "games" && (
          <div className="space-y-6">
            <section className="bg-[#111] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold">My Games</h2>
                {loadingSessions && <span className="text-xs text-gray-400">Syncing...</span>}
              </div>

              <select
                value={sessionStatus}
                onChange={(event) => {
                  setSessionStatus(event.target.value as SessionStatus | "");
                  setSessionPage(1);
                }}
                className="mb-4 w-full bg-[#EDEDED] px-4 py-3 text-sm text-slate-900 outline-none"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>

              <div>
                {sessions.length ? (
                  sessions.map((session) => {
                    const isReceived = String(session.invitedUserId || "") === String(userId);
                    const opponent = isReceived
                      ? session.inviter?.username || "Opponent"
                      : session.invitedUser?.username || session.invitedUsername;

                    return (
                      <GameRow
                        key={session._id}
                        title={`${session.gameName} vs @${opponent}`}
                        status={`${isReceived ? "Received" : "Sent"} - ${session.status}`}
                        statusColor={
                          session.status === "declined" ? "text-red-500" : "text-[#1688D1]"
                        }
                        action={
                          <SessionActions
                            isReceived={isReceived}
                            session={session}
                            onAccept={() => updateInviteStatus(session, "accept")}
                            onDecline={() => updateInviteStatus(session, "decline")}
                            onDelete={() => deleteSession(session._id)}
                            onJoin={() =>
                              navigate({
                                to: "/game-room/$sessionId",
                                params: { sessionId: session.sessionId || session._id },
                              })
                            }
                          />
                        }
                      />
                    );
                  })
                ) : (
                  <p className="bg-black/30 p-4 text-center text-sm text-gray-400">
                    No sessions found.
                  </p>
                )}
              </div>

              <Pager
                page={sessionsPagination.page}
                totalPages={sessionsPagination.totalPages}
                onPrevious={() => setSessionPage((page) => Math.max(page - 1, 1))}
                onNext={() =>
                  setSessionPage((page) =>
                    Math.min(page + 1, sessionsPagination.totalPages || page),
                  )
                }
              />
            </section>

            <section className="bg-[#111] p-5">
              <h2 className="mb-4 text-xl font-bold">Online Players</h2>
              <label className="mb-4 flex items-center gap-2 bg-[#EDEDED] px-4 py-3 text-slate-900">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={onlineSearch}
                  onChange={(event) => {
                    setOnlineSearch(event.target.value);
                    setOnlinePage(1);
                  }}
                  placeholder="Search players"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>

              {loadingOnlineUsers ? (
                <p className="text-sm text-gray-400">Loading online players...</p>
              ) : onlineUsers.length ? (
                onlineUsers.map((onlineUser) => (
                  <PlayerRow
                    key={onlineUser._id}
                    username={`@${onlineUser.username}`}
                    status={onlineUser.isOnline ? "Online" : "Away"}
                    onInvite={() => setActiveTab("invite")}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-400">No online players found.</p>
              )}

              <Pager
                page={onlinePagination.page}
                totalPages={onlinePagination.totalPages}
                onPrevious={() => setOnlinePage((page) => Math.max(page - 1, 1))}
                onNext={() =>
                  setOnlinePage((page) => Math.min(page + 1, onlinePagination.totalPages || page))
                }
              />
            </section>
          </div>
        )}

        {activeTab === "invite" && (
          <InviteForm selectedGameId={lobbyGame.id} onInviteCreated={() => loadSessions(true)} />
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
      <p className="w-[38%] truncate text-sm text-white">{title}</p>
      <p className={`flex-1 truncate text-xs italic ${statusColor}`}>{status}</p>
      {action && <div className="ml-3 shrink-0">{action}</div>}
    </div>
  );
}

type SessionActionsProps = {
  isReceived: boolean;
  session: Session;
  onAccept: () => void;
  onDecline: () => void;
  onDelete: () => void;
  onJoin: () => void;
};

function SessionActions({
  isReceived,
  session,
  onAccept,
  onDecline,
  onDelete,
  onJoin,
}: SessionActionsProps) {
  if (isReceived && session.status === "pending") {
    return (
      <div className="flex gap-2">
        <button onClick={onAccept} className="bg-[#47B312] px-3 py-1.5 text-xs font-semibold">
          Accept
        </button>
        <button onClick={onDecline} className="bg-red-600 px-3 py-1.5 text-xs font-semibold">
          Decline
        </button>
      </div>
    );
  }

  if (session.status === "accepted" || session.status === "active") {
    return (
      <div className="flex items-center gap-2">
        <button onClick={onJoin} className="bg-[#385FF4] px-3 py-1.5 text-xs font-semibold">
          Join Game
        </button>
        {!session.startedAt && (
          <button
            onClick={onDelete}
            className="bg-[#1C1C1E] p-1.5 text-red-300"
            aria-label="Delete game"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  if (session.status === "pending") {
    return (
      <button
        onClick={onDelete}
        className="bg-[#1C1C1E] p-1.5 text-red-300"
        aria-label="Delete game"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return null;
}

type PlayerRowProps = {
  username: string;
  status: string;
  onInvite?: () => void;
};

function PlayerRow({ username, status, onInvite }: PlayerRowProps) {
  return (
    <div className="flex items-center border-b border-gray-800 py-4 last:border-b-0">
      <span className="w-[42%] truncate text-sm text-white">{username}</span>
      <span
        className={`flex-1 text-xs ${status === "Online" ? "text-green-500" : "text-yellow-500"}`}
      >
        {status}
      </span>
      <button onClick={onInvite} className="bg-[#1C1C1E] px-4 py-1.5 text-xs text-[#1688D1]">
        Invite
      </button>
    </div>
  );
}

type PagerProps = {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
};

function Pager({ page, totalPages, onPrevious, onNext }: PagerProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between text-xs text-gray-300">
      <button
        onClick={onPrevious}
        disabled={page <= 1}
        className="bg-[#1C1C1E] px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page >= totalPages}
        className="bg-[#1C1C1E] px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
