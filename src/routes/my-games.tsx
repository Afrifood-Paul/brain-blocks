import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

import NotificationsBell from "@/components/NotificationsBell";
import { GAMES } from "@/constants/games";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/router/ProtectedRoute";
import { requireAuth } from "@/router/guards";
import { apiClient, type PaginationMeta, type Session, type SessionStatus } from "@/services/api";

export const Route = createFileRoute("/my-games")({
  beforeLoad: requireAuth,
  component: () => (
    <ProtectedRoute>
      <MyGames />
    </ProtectedRoute>
  ),
});

const paginationFallback: PaginationMeta = {
  page: 1,
  limit: 8,
  total: 0,
  totalPages: 0,
};

const getUserId = (user: { _id?: string; id?: string } | null) => user?._id || user?.id || "";

function MyGames() {
  const [status, setStatus] = useState<SessionStatus | "">("");
  const [gameId, setGameId] = useState("");
  const [page, setPage] = useState(1);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pagination, setPagination] = useState(paginationFallback);
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const userId = getUserId(user);
  const navigate = useNavigate();

  const loadSessions = useCallback(
    async (force = false) => {
      if (authLoading || !userId) return;

      setLoading(true);
      try {
        const res = await apiClient.getSessions({ status, gameId, page, limit: 8 }, force);
        setSessions(res.sessions || []);
        setPagination(res.pagination || paginationFallback);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load games");
      } finally {
        setLoading(false);
      }
    },
    [authLoading, gameId, page, status, userId],
  );

  useEffect(() => {
    if (authLoading || !userId) return;

    loadSessions(true);

    // Keep one low-frequency poller and pause it while the tab is hidden to reduce API load.
    const refreshVisibleSessions = () => {
      if (!document.hidden) loadSessions(true);
    };
    const interval = window.setInterval(refreshVisibleSessions, 45000);
    document.addEventListener("visibilitychange", refreshVisibleSessions);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshVisibleSessions);
    };
  }, [authLoading, loadSessions, userId]);

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
    <main className="min-h-screen bg-black px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Games</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate({ to: "/game-lobby" })}
              className="bg-[#0B2177] px-4 py-2 text-sm font-semibold"
            >
              Lobby
            </button>
            <NotificationsBell userId={userId} />
          </div>
        </header>

        <section className="mb-4 grid gap-3 bg-[#111] p-4 sm:grid-cols-2">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as SessionStatus | "");
              setPage(1);
            }}
            className="bg-[#EDEDED] px-4 py-3 text-sm text-slate-900 outline-none"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={gameId}
            onChange={(event) => {
              setGameId(event.target.value);
              setPage(1);
            }}
            className="bg-[#EDEDED] px-4 py-3 text-sm text-slate-900 outline-none"
          >
            <option value="">All games</option>
            {GAMES.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
        </section>

        <section className="bg-[#111] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sessions</h2>
            {loading && <span className="text-xs text-gray-400">Syncing...</span>}
          </div>

          <div className="space-y-3">
            {sessions.length ? (
              sessions.map((session) => {
                const isReceived = String(session.invitedUserId || "") === String(userId);
                const opponent = isReceived
                  ? session.inviter?.username || "Opponent"
                  : session.invitedUser?.username || session.invitedUsername;
                const canDelete = session.status === "pending" || !session.startedAt;

                return (
                  <article key={session._id} className="bg-black/30 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{session.gameName}</h3>
                        <p className="mt-1 text-sm text-gray-400">vs @{opponent}</p>
                        <p className="mt-2 text-xs uppercase text-[#9FC8F6]">{session.status}</p>
                      </div>
                      <div className="flex gap-2">
                        {(session.status === "accepted" || session.status === "active") && (
                          <button
                            onClick={() =>
                              navigate({
                                to: "/game-room/$sessionId",
                                params: { sessionId: session.sessionId || session._id },
                              })
                            }
                            className="bg-[#385FF4] px-4 py-2 text-xs font-semibold"
                          >
                            Join Game
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => deleteSession(session._id)}
                            className="bg-[#1C1C1E] p-2 text-red-300"
                            aria-label="Delete game"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="bg-black/30 p-5 text-center text-sm text-gray-400">
                No games match these filters.
              </p>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between text-xs text-gray-300">
              <button
                onClick={() => setPage((value) => Math.max(value - 1, 1))}
                disabled={page <= 1}
                className="bg-[#1C1C1E] px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((value) => Math.min(value + 1, pagination.totalPages))}
                disabled={page >= pagination.totalPages}
                className="bg-[#1C1C1E] px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
