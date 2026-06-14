import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import NotificationsBell from "@/components/NotificationsBell";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/router/ProtectedRoute";
import { requireAuth } from "@/router/guards";
import { apiClient, type Session, type SessionPlayer } from "@/services/api";

export const Route = createFileRoute("/game-room/$sessionId")({
  beforeLoad: requireAuth,
  component: () => (
    <ProtectedRoute>
      <GameRoom />
    </ProtectedRoute>
  ),
});

const getUserId = (user: { _id?: string; id?: string } | null) => user?._id || user?.id || "";

const gameRoutes: Record<string, string> = {
  ludo: "/ludo",
  chess: "/chess",
  chessboard: "/chessboard",
  picturepuzzle: "/picturepuzzle",
};

function GameRoom() {
  const { sessionId } = Route.useParams();
  const { user } = useAuth();
  const userId = getUserId(user);
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const players = useMemo(() => session?.players || [], [session]);
  const bothPlayersPresent = players.length >= 2;
  const playRoute = session ? gameRoutes[session.gameId] : undefined;

  const loadSession = useCallback(
    async (force = false) => {
      try {
        const res = await apiClient.getSession(sessionId, force);
        setSession(res.session);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load game room");
      } finally {
        setLoading(false);
      }
    },
    [sessionId],
  );

  useEffect(() => {
    loadSession(true);

    // Session state comes from the backend; poll gently and pause while the tab is hidden.
    const refreshVisibleSession = () => {
      if (!document.hidden) loadSession(true);
    };
    const interval = window.setInterval(refreshVisibleSession, 45000);
    document.addEventListener("visibilitychange", refreshVisibleSession);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshVisibleSession);
    };
  }, [loadSession]);

  useEffect(() => {
    if (!session?.gameId) return;
    apiClient.updatePresence(true, session.gameId).catch(() => undefined);
    return () => {
      apiClient.updatePresence(true, null).catch(() => undefined);
    };
  }, [session?.gameId]);

  const startGame = async () => {
    setStarting(true);
    try {
      const res = await apiClient.startSession(sessionId);
      setSession(res.session);
      toast.success("Game started");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start game");
    } finally {
      setStarting(false);
    }
  };

  const enterGame = () => {
    if (!session) {
      toast.error("Session unavailable");
      return;
    }
    if (!playRoute) {
      toast.error("REQUIRED BACKEND ENDPOINT: game launch route for this gameId is not configured");
      return;
    }

    if (session.gameId === "chess") {
      // Invited chess games use the session id as the shared socket room/game id.
      navigate({
        to: "/chess",
        search: { gameId: session.sessionId || session._id },
      });
      return;
    }

    navigate({ to: playRoute as never });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#9FC8F6]" />
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="max-w-sm bg-[#111] p-6 text-center">
          <h1 className="text-xl font-bold">Game room unavailable</h1>
          <button
            onClick={() => navigate({ to: "/game-lobby" })}
            className="mt-4 bg-[#0B2177] px-4 py-2 text-sm font-semibold"
          >
            Back to My Games
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-[#9FC8F6]">Game Room</p>
            <h1 className="text-2xl font-bold">{session.gameName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate({ to: "/my-games" })}
              className="bg-[#0B2177] px-4 py-2 text-sm font-semibold"
            >
              My Games
            </button>
            <NotificationsBell userId={userId} />
          </div>
        </header>

        <section className="grid gap-4">
          <div className="bg-[#111] p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400">Session</p>
                <p className="mt-1 break-all font-mono text-xs text-[#9FC8F6]">
                  {session.sessionId || session._id}
                </p>
              </div>
              <span className="bg-[#1C1C1E] px-3 py-1 text-xs uppercase text-[#9FC8F6]">
                {session.status}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile label="Game ID" value={session.gameId} />
              <InfoTile label="Stake" value={`NGN ${session.amount}`} />
            </div>

            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold">Players</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <PlayerCard label="Inviter" player={session.inviter} />
                <PlayerCard label="Invited" player={session.invitedUser} />
              </div>
            </div>
          </div>

          <aside className="bg-[#111] p-5">
            <h2 className="text-lg font-semibold">Ready Check</h2>
            <p className="mt-2 text-sm text-gray-400">
              Room state is refreshed from the backend every few seconds.
            </p>

            <div className="mt-5 space-y-3">
              <StatusLine label="Both players present" active={bothPlayersPresent} />
              <StatusLine label="Invite accepted" active={session.status !== "pending"} />
              <StatusLine label="Game active" active={session.status === "active"} />
            </div>

            {session.status === "accepted" && (
              <button
                onClick={startGame}
                disabled={!bothPlayersPresent || starting}
                className="mt-6 flex w-full items-center justify-center gap-2 bg-[#47B312] px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {starting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Start Game
              </button>
            )}

            {session.status === "active" && (
              <button
                onClick={enterGame}
                className="mt-6 flex w-full items-center justify-center gap-2 bg-[#385FF4] px-4 py-3 text-sm font-semibold"
              >
                <Play className="h-4 w-4" />
                Play
              </button>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/30 p-4">
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}

function PlayerCard({ label, player }: { label: string; player?: SessionPlayer }) {
  return (
    <div className="bg-black/30 p-4">
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="mt-2 font-semibold">@{player?.username || "Waiting"}</p>
      <p className={`mt-2 text-xs ${player?.isOnline ? "text-green-400" : "text-gray-500"}`}>
        {player?.isOnline ? "Online" : "Offline"}
      </p>
    </div>
  );
}

function StatusLine({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-black/30 px-3 py-2 text-sm">
      <span>{label}</span>
      <span className={active ? "text-green-400" : "text-gray-500"}>{active ? "Yes" : "No"}</span>
    </div>
  );
}
