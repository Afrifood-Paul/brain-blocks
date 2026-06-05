import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  Coins,
  Crown,
  Loader2,
  RefreshCw,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import ludoIcon from "@/assets/ludoIcon.png";
import { useAuth } from "@/context/AuthContext";
import { formatCoins, useWallet } from "@/context/WalletContext";
import { API_ORIGIN, apiClient } from "@/services/api";
import { connectSocket, socket } from "@/services/socket";
import { LudoBoard } from "./LudoBoard";
import { LudoDice } from "./LudoDice";
import {
  ludoColors as colors,
  normalizeBoard,
  type LudoBoardState,
  type LudoColor,
  type LudoToken,
} from "./ludoBoardUtils";

type LudoPlayer = {
  userId: string;
  username: string;
  name?: string;
  avatar?: string;
  color: LudoColor;
  online: boolean;
};

type LudoRoom = {
  roomId: string;
  betAmount: number;
  pot: number;
  maxPlayers: number;
  minPlayers: number;
  turnSeconds: number;
  status: "waiting" | "countdown" | "active" | "finished" | "cancelled";
  players: LudoPlayer[];
  board?: Partial<Record<LudoColor, LudoToken[]>>;
  currentTurn?: LudoColor | null;
  lastDice?: number | null;
  mustMove?: boolean;
  turnDeadlineAt?: string | null;
  countdownEndsAt?: string | null;
  winnerColor?: LudoColor | null;
  winnerUserId?: string | null;
  result?: {
    pot?: number;
    payout?: number;
    platformFee?: number;
  };
  playerColor?: LudoColor | null;
  createdAt: string;
};

type LudoMove = {
  color: LudoColor;
  tokenId: number;
  from: number;
  to: number;
  killed?: { color: LudoColor; tokenId: number }[];
};

const colorClasses: Record<LudoColor, string> = {
  red: "bg-red-500 border-red-200",
  green: "bg-emerald-500 border-emerald-200",
  yellow: "bg-yellow-400 border-yellow-100 text-slate-950",
  blue: "bg-sky-500 border-sky-200",
};

const colorText: Record<LudoColor, string> = {
  red: "text-red-300",
  green: "text-emerald-300",
  yellow: "text-yellow-200",
  blue: "text-sky-300",
};

const getAvatarSrc = (avatar?: string) => {
  if (!avatar) return ludoIcon;
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return avatar.startsWith("/") ? `${API_ORIGIN}${avatar}` : avatar;
};

const getDisplayName = (player?: LudoPlayer | null) =>
  player?.name || player?.username || "Waiting";

const getTimeLeft = (iso?: string | null) => {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000));
};

const Ludo = () => {
  const navigate = useNavigate();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { activeCoins, fetchBalance, inactiveCoins, setLocalCoins } = useWallet();
  const [rooms, setRooms] = useState<LudoRoom[]>([]);
  const [room, setRoom] = useState<LudoRoom | null>(null);
  const [betAmount, setBetAmount] = useState(200);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [turnSeconds, setTurnSeconds] = useState(25);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [visibleDice, setVisibleDice] = useState<number | null>(null);
  const [legalTokenIds, setLegalTokenIds] = useState<number[]>([]);
  const [clockTick, setClockTick] = useState(Date.now());
  const [displayBoard, setDisplayBoard] = useState<LudoBoardState>(() => normalizeBoard());
  const [moveEffect, setMoveEffect] = useState<{
    color: LudoColor;
    tokenId: number;
    killed?: { color: LudoColor; tokenId: number }[];
  } | null>(null);
  const animationTimers = useRef<number[]>([]);
  const isAnimatingMove = useRef(false);

  const playerColor = room?.playerColor || null;
  const isMyTurn = Boolean(
    room?.status === "active" && playerColor && room.currentTurn === playerColor,
  );
  const currentPlayer = room?.players.find((player) => player.color === room.currentTurn);
  const winner = room?.players.find((player) => player.color === room.winnerColor);
  const countdownLeft = getTimeLeft(room?.countdownEndsAt);
  const turnLeft = getTimeLeft(room?.turnDeadlineAt);

  const clearAnimationTimers = useCallback(() => {
    animationTimers.current.forEach((timer) => window.clearTimeout(timer));
    animationTimers.current = [];
    isAnimatingMove.current = false;
  }, []);

  const cloneBoard = useCallback((source: LudoBoardState): LudoBoardState => {
    return {
      red: source.red.map((token) => ({ ...token })),
      green: source.green.map((token) => ({ ...token })),
      yellow: source.yellow.map((token) => ({ ...token })),
      blue: source.blue.map((token) => ({ ...token })),
    };
  }, []);

  const animateMove = useCallback(
    (nextRoom: LudoRoom, move?: LudoMove) => {
      const finalBoard = normalizeBoard(nextRoom.board);

      if (!move) {
        if (isAnimatingMove.current) return;
        clearAnimationTimers();
        setDisplayBoard(finalBoard);
        setMoveEffect(null);
        return;
      }

      clearAnimationTimers();
      isAnimatingMove.current = true;
      setMoveEffect({
        color: move.color,
        tokenId: move.tokenId,
        killed: move.killed || [],
      });

      const steps: number[] = [];
      if (move.from < 0) {
        steps.push(0);
      } else {
        for (let progress = move.from + 1; progress <= move.to; progress += 1) {
          steps.push(progress);
        }
      }

      if (!steps.length) {
        setDisplayBoard(finalBoard);
        setMoveEffect(null);
        return;
      }

      steps.forEach((progress, index) => {
        const timer = window.setTimeout(() => {
          setDisplayBoard((current) => {
            const next = cloneBoard(current);
            const token = next[move.color].find((item) => item.id === move.tokenId);
            if (token) token.progress = progress;
            return next;
          });
        }, index * 120);
        animationTimers.current.push(timer);
      });

      const finishTimer = window.setTimeout(
        () => {
          setDisplayBoard(finalBoard);
          setMoveEffect(null);
          isAnimatingMove.current = false;
        },
        steps.length * 120 + 180,
      );

      animationTimers.current.push(finishTimer);
    },
    [clearAnimationTimers, cloneBoard],
  );

  const loadRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const res = await apiClient.getLudoRooms();
      setRooms(res.rooms || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to load Ludo rooms");
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClockTick(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    loadRooms();
  }, [authLoading, isAuthenticated, loadRooms]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    connectSocket();

    const applyState = (nextRoom: LudoRoom, options: { preserveDiceMotion?: boolean } = {}) => {
      setRoom(nextRoom);
      animateMove(nextRoom);
      setRooms((current) => current.filter((item) => item.roomId !== nextRoom.roomId));
      setJoiningRoomId(null);
      if (!nextRoom.lastDice && !options.preserveDiceMotion) {
        setVisibleDice(null);
        setRolling(false);
      }

      if (!nextRoom.mustMove) {
        setLegalTokenIds([]);
      }
    };

    const handleDice = (nextRoom: LudoRoom & { dice?: number; legalTokenIds?: number[] }) => {
      applyState(nextRoom, { preserveDiceMotion: true });
      if (nextRoom.dice) {
        setVisibleDice(nextRoom.dice);
        window.setTimeout(() => {
          setRolling(false);
          if (!nextRoom.lastDice) setVisibleDice(null);
        }, 650);
      }
      setLegalTokenIds(nextRoom.legalTokenIds || []);
    };

    const handlePieceMoved = (nextRoom: LudoRoom & { move?: LudoMove }) => {
      setRoom(nextRoom);
      animateMove(nextRoom, nextRoom.move);
      setLegalTokenIds([]);
      setRolling(false);
    };

    const handleFinished = (nextRoom: LudoRoom) => {
      applyState(nextRoom);
      fetchBalance().catch(() => {});
      toast.success("Ludo match finished");
    };

    const handleError = (payload: { message?: string }) => {
      setJoiningRoomId(null);
      setRolling(false);
      setVisibleDice(null);
      toast.error(payload.message || "Ludo action failed");
    };

    socket.on("ludo_state", applyState);
    socket.on("dice_rolled", handleDice);
    socket.on("piece_moved", handlePieceMoved);
    socket.on("player_disconnected", applyState);
    socket.on("game_finished", handleFinished);
    socket.on("ludo_error", handleError);

    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("roomId");
    if (roomId) {
      setJoiningRoomId(roomId);
      socket.emit("join_room", { roomId });
    }

    return () => {
      socket.off("ludo_state", applyState);
      socket.off("dice_rolled", handleDice);
      socket.off("piece_moved", handlePieceMoved);
      socket.off("player_disconnected", applyState);
      socket.off("game_finished", handleFinished);
      socket.off("ludo_error", handleError);
    };
  }, [animateMove, authLoading, fetchBalance, isAuthenticated]);

  useEffect(() => {
    return () => clearAnimationTimers();
  }, [clearAnimationTimers]);

  const createRoom = async () => {
    if (creating) return;

    setCreating(true);
    try {
      const res = await apiClient.createLudoRoom({
        betAmount,
        maxPlayers,
        turnSeconds,
      });

      if (typeof res.coins === "number") {
        setLocalCoins(res.coins);
      }

      const roomId = res.roomId;
      window.history.replaceState(null, "", `/ludo?roomId=${roomId}`);
      connectSocket();
      socket.emit("join_room", { roomId });
      toast.success("Ludo room created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create room");
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = (roomId: string) => {
    setJoiningRoomId(roomId);
    window.history.replaceState(null, "", `/ludo?roomId=${roomId}`);
    connectSocket();
    socket.emit("join_room", { roomId });
    fetchBalance().catch(() => {});
  };

  const rollDice = () => {
    if (!room || !isMyTurn || room.lastDice || rolling) return;
    setRolling(true);
    setVisibleDice(null);
    socket.emit("roll_dice", { roomId: room.roomId });
  };

  const moveToken = (tokenId: number) => {
    if (!room || !isMyTurn || !room.mustMove || !legalTokenIds.includes(tokenId)) return;
    socket.emit("move_piece", { roomId: room.roomId, tokenId });
  };

  const renderPlayerCard = (player?: LudoPlayer, color?: LudoColor) => {
    const isActive = room?.status === "active" && room.currentTurn === player?.color;
    const displayColor = player?.color || color || "red";

    return (
      <div
        className={`rounded-lg border bg-secondary p-3 transition ${
          isActive
            ? "animate-pulse border-primary shadow-[0_0_0_1px_rgba(56,95,244,0.65),0_0_22px_rgba(56,95,244,0.22)]"
            : "border-border"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`h-11 w-11 overflow-hidden rounded-full border-2 ${colorClasses[displayColor]}`}
          >
            <img
              src={getAvatarSrc(player?.avatar)}
              alt={getDisplayName(player)}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{getDisplayName(player)}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`font-semibold capitalize ${colorText[displayColor]}`}>
                {displayColor}
              </span>
              {player ? (
                player.online ? (
                  <Wifi className="h-3.5 w-3.5 text-emerald-300" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-red-300" />
                )
              ) : (
                <span>Open seat</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBoard = () => {
    return (
      <LudoBoard
        board={displayBoard}
        playerColor={playerColor}
        currentTurn={room?.currentTurn}
        isMyTurn={isMyTurn}
        mustMove={room?.mustMove}
        legalTokenIds={legalTokenIds}
        lastDice={room?.lastDice}
        onTokenClick={moveToken}
        moveEffect={moveEffect}
      />
    );
  };

  const renderLobbySeat = (player?: LudoPlayer, fallback = "Open seat") => {
    const displayColor = player?.color || "blue";

    return (
      <div className="flex w-full items-center justify-between gap-3 rounded px-0 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`h-12 w-12 shrink-0 overflow-hidden rounded-full border-4 ${colorClasses[displayColor]} sm:h-14 sm:w-14`}
          >
            <img
              src={getAvatarSrc(player?.avatar)}
              alt={player ? getDisplayName(player) : fallback}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-tight sm:text-xl">
              {player ? `@${getDisplayName(player)}` : fallback}
            </p>
            <p className="text-xs text-white/60">
              {player ? `${displayColor} player` : "Waiting for player"}
            </p>
          </div>
        </div>
        <div className="shrink-0 rounded border border-[#008FF0] bg-[#46597A] px-4 py-2">
          <span className="text-xs font-bold capitalize text-foreground">
            {player ? "Ready" : "Open"}
          </span>
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-md mx-auto bg-background px-4 py-5 text-foreground">
      <div className="mx-auto w-full max-w-md space-y-5 xl:max-w-6xl">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
          <div className="flex items-center gap-2 rounded-full bg-[#dfe7ff] px-4 py-2 text-sm font-bold text-slate-900">
            <Coins className="h-4 w-4" />
            {formatCoins(activeCoins)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded bg-secondary p-3">
            <p className="text-muted-foreground">Inactive</p>
            <p className="mt-1 font-bold">{formatCoins(inactiveCoins)}</p>
          </div>
          <div className="rounded bg-secondary p-3">
            <p className="text-muted-foreground">Active</p>
            <p className="mt-1 font-bold">{formatCoins(activeCoins)}</p>
          </div>
        </div>

        {!room ? (
          <div className="grid min-w-0 gap-5">
            <section className="min-w-0 rounded bg-secondary p-5">
              <div className="flex items-center gap-3">
                <img src={ludoIcon} alt="Ludo" className="h-12 w-12 object-contain" />
                <div>
                  <h1 className="text-xl font-bold">Ludo Arena</h1>
                  <p className="text-sm text-muted-foreground">Create a coin bet room</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block text-sm font-semibold">
                  Bet amount
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    value={betAmount}
                    onChange={(event) => setBetAmount(Number(event.target.value))}
                    className="mt-2 h-12 w-full rounded-full bg-white px-4 text-sm text-black outline-none"
                  />
                </label>

                <label className="block text-sm font-semibold">
                  Players
                  <select
                    value={maxPlayers}
                    onChange={(event) => setMaxPlayers(Number(event.target.value))}
                    className="mt-2 h-12 w-full rounded-full bg-[#9FC8F6] px-4 text-sm font-semibold text-[#0B2177] outline-none"
                  >
                    <option value={2}>2 players</option>
                    <option value={3}>3 players</option>
                    <option value={4}>4 players</option>
                  </select>
                </label>

                <label className="block text-sm font-semibold">
                  Turn timer
                  <select
                    value={turnSeconds}
                    onChange={(event) => setTurnSeconds(Number(event.target.value))}
                    className="mt-2 h-12 w-full rounded-full bg-[#9FC8F6] px-4 text-sm font-semibold text-[#0B2177] outline-none"
                  >
                    <option value={15}>15 seconds</option>
                    <option value={25}>25 seconds</option>
                    <option value={30}>30 seconds</option>
                  </select>
                </label>

                <button
                  onClick={createRoom}
                  disabled={creating}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-white disabled:opacity-60"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Room
                </button>
              </div>
            </section>

            <section className="min-w-0 rounded bg-secondary p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Available Rooms</h2>
                  <p className="text-sm text-muted-foreground">Join a live coin challenge</p>
                </div>
                <button
                  onClick={loadRooms}
                  className="rounded-full bg-muted p-2"
                  aria-label="Refresh rooms"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-6">
                {loadingRooms ? (
                  <div className="flex h-28 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : rooms.length ? (
                  rooms.map((item) => (
                    <article
                      key={item.roomId}
                      className="mx-auto flex w-full max-w-md flex-col items-center text-white"
                    >
                      {renderLobbySeat(item.players[0], "Host seat")}

                      <div className="flex w-full justify-center">
                        <div className="grid aspect-square w-full max-w-[260px] grid-rows-[1fr_auto_1fr] overflow-hidden border-4 border-[#333333] bg-[#111827] sm:max-w-[320px] sm:border-8">
                          <div className="grid grid-cols-3">
                            <div className="bg-emerald-500/90" />
                            <div className="bg-white" />
                            <div className="bg-red-500/90" />
                          </div>

                          <div className="grid grid-cols-[1fr_auto_1fr]">
                            <div className="grid grid-rows-3">
                              <div className="bg-white" />
                              <div className="bg-yellow-400/90" />
                              <div className="bg-white" />
                            </div>

                            <div className="flex h-28 w-28 flex-col items-center justify-center bg-slate-950 px-3 text-center sm:h-32 sm:w-32">
                              <p className="text-xs font-semibold uppercase text-white/60">Room</p>
                              <p className="mt-1 text-lg font-black leading-tight">
                                {formatCoins(item.betAmount)}
                              </p>
                              <p className="mt-1 max-w-full truncate font-mono text-[10px] text-white/50">
                                {item.roomId}
                              </p>
                            </div>

                            <div className="grid grid-rows-3">
                              <div className="bg-white" />
                              <div className="bg-sky-500/90" />
                              <div className="bg-white" />
                            </div>
                          </div>

                          <div className="grid grid-cols-3">
                            <div className="bg-yellow-400/90" />
                            <div className="bg-white" />
                            <div className="bg-sky-500/90" />
                          </div>
                        </div>
                      </div>

                      <div className="grid w-full grid-cols-3 gap-2 py-3 text-center text-xs">
                        <div className="rounded border border-[#008FF0] bg-[#46597A] px-2 py-2">
                          <Users className="mx-auto mb-1 h-3.5 w-3.5" />
                          <p className="font-bold">
                            {item.players.length}/{item.maxPlayers}
                          </p>
                        </div>
                        <div className="rounded border border-[#008FF0] bg-[#46597A] px-2 py-2">
                          <Clock3 className="mx-auto mb-1 h-3.5 w-3.5" />
                          <p className="font-bold">{item.turnSeconds}s</p>
                        </div>
                        <div className="rounded border border-[#008FF0] bg-[#46597A] px-2 py-2">
                          <p className="mb-1 text-[10px] uppercase text-white/60">Status</p>
                          <p className="truncate font-bold capitalize">{item.status}</p>
                        </div>
                      </div>

                      {renderLobbySeat(item.players[1], "Opponent seat")}

                      <button
                        onClick={() => joinRoom(item.roomId)}
                        disabled={joiningRoomId === item.roomId}
                        className="mt-2 w-full rounded-full bg-[#9FC8F6] px-5 py-3 text-sm font-bold text-[#0B2177] disabled:opacity-60"
                      >
                        {joiningRoomId === item.roomId ? "Joining..." : "Join"}
                      </button>
                    </article>
                  ))
                ) : (
                  <div className="rounded-lg bg-black/30 p-6 text-center text-sm text-muted-foreground">
                    No open Ludo rooms yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="grid min-w-0 gap-5">
            <aside className="min-w-0 space-y-3">
              <section className="rounded bg-secondary p-4">
                <p className="text-xs uppercase text-muted-foreground">Match Status</p>
                <h1 className="mt-1 text-2xl font-bold capitalize">{room.status}</h1>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded bg-black/30 p-3">
                    <p className="text-xs text-muted-foreground">Bet</p>
                    <p className="font-bold">{formatCoins(room.betAmount)}</p>
                  </div>
                  <div className="rounded bg-black/30 p-3">
                    <p className="text-xs text-muted-foreground">Pot</p>
                    <p className="font-bold">{formatCoins(room.pot || 0)}</p>
                  </div>
                </div>
              </section>

              {colors.slice(0, room.maxPlayers).map((color) =>
                renderPlayerCard(
                  room.players.find((player) => player.color === color),
                  color,
                ),
              )}
            </aside>

            {renderBoard()}

            <section className="min-w-0 space-y-4">
              <div className="rounded bg-secondary p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Current Turn</p>
                    <p className="text-lg font-bold">
                      {currentPlayer ? getDisplayName(currentPlayer) : "Waiting for players"}
                    </p>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    {room.status === "countdown" && (
                      <div className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">
                        Starts in {countdownLeft}s
                      </div>
                    )}
                    {room.status === "active" && (
                      <div className="flex items-center gap-2 rounded bg-muted px-4 py-2 text-sm font-bold">
                        <Clock3 className="h-4 w-4 text-primary" />
                        {turnLeft}s
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* {renderBoard()} */}
            </section>

            <aside className="min-w-0 space-y-4">
              <section className="rounded bg-secondary p-5 text-center">
                <p className="text-xs uppercase text-muted-foreground">Dice</p>
                <LudoDice
                  value={visibleDice ?? room.lastDice}
                  rolling={rolling}
                  disabled={!isMyTurn || Boolean(room.lastDice) || rolling}
                  onRoll={rollDice}
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  {isMyTurn
                    ? room.mustMove
                      ? "Choose a highlighted token."
                      : "Roll before the timer expires."
                    : "Waiting for opponent turn."}
                </p>
              </section>

              <section className="rounded bg-secondary p-5">
                <h2 className="font-bold">Room</h2>
                <p className="mt-2 break-all rounded bg-black/30 p-3 font-mono text-xs text-muted-foreground">
                  {room.roomId}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/ludo?roomId=${room.roomId}`,
                    );
                    toast.success("Invite link copied");
                  }}
                  className="mt-3 w-full rounded-full bg-[#9FC8F6] px-4 py-2 text-sm font-bold text-[#0B2177]"
                >
                  Copy Invite Link
                </button>
              </section>
            </aside>

            {(room.status === "finished" || room.status === "cancelled") && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
                <div className="ludo-result-pop w-full max-w-sm rounded bg-white p-6 text-center text-slate-950">
                  {room.status === "finished" ? (
                    <>
                      <Crown className="mx-auto h-12 w-12 text-amber-500" />
                      <h2 className="mt-3 text-2xl font-black">{getDisplayName(winner)} wins</h2>
                      <p className="mt-2 text-sm text-slate-600">
                        Prize paid: {formatCoins(room.result?.payout || 0)}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-black">Room Cancelled</h2>
                      <p className="mt-2 text-sm text-slate-600">
                        Locked bets were refunded where applicable.
                      </p>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setRoom(null);
                      window.history.replaceState(null, "", "/ludo");
                      loadRooms();
                    }}
                    className="mt-5 w-full rounded-full bg-primary px-4 py-3 text-sm font-bold text-white"
                  >
                    Back to Lobby
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default Ludo;
