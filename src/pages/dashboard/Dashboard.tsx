import React, { useState } from "react";
import { Eye, EyeOff, Plus } from "lucide-react";
import iconPuzzle from "@/assets/puzzleIcon.png";
import iconLudo from "@/assets/ludoIcon.png";
import iconChess from "@/assets/chessIcon.png";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "@tanstack/react-router";


const games = [
  { name: "Picture\nPuzzle", bg: "from-sky-400 to-blue-500", icon: iconPuzzle },
  { name: "Ludo", bg: "from-purple-400 to-violet-500", icon: iconLudo },
  { name: "Chess", bg: "from-green-400 to-emerald-500", icon: iconChess },
  { name: "Scrabble", bg: "from-orange-400 to-amber-500", icon: iconPuzzle },
];

const joinChallenges = [
  { game: "Picture Puzzle", amount: "N500" },
  { game: "Scrabble", amount: "N800" },
  { game: "Ludo", amount: "N1200" },
  { game: "Chess", amount: "N800" },
];

const directChallenges = [
  { game: "Picture Puzzle", amount: "N500", from: "@DesignWizard" },
  { game: "Scrabble", amount: "N800", from: "@Fela" },
  { game: "Ludo", amount: "N700", from: "@Paul" },
];
const Dashboard = () => {
  const [showBalance, setShowBalance] = useState(true);
  
 const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };


  return (
    <main className="min-h-screen bg-background px-4 py-5">
      <div className="flex - justify-end mr-2">
         <button  onClick={handleLogout} className="bg-gradient-to-br from-[#dfe7ff] to-[#c9d6ff] text-slate-900 relative text-[#B6D8FF] text-xs font-semibold px-4 py-2 mb-2 rounded-full">
              Logout
            </button>
      </div>
      <div className="max-w-md mx-auto space-y-5">
        {/* Wallet Card */}
        <div className="rounded-3xl p-5 bg-gradient-to-br from-[#dfe7ff] to-[#c9d6ff] text-slate-900 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Wallet Balance</p>

              <div className="flex items-center gap-2 mt-2">
                <h2 className="text-2xl font-bold">
                  {showBalance ? <>₦128,390.00</> : "••••••••"}
                </h2>

                <button onClick={() => setShowBalance(!showBalance)}>
                  {showBalance ? (
                    <Eye className="w-4 h-4 text-[#0B2177] cursor-pointer" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-[#0B2177] cursor-pointer" />
                  )}
                </button>
              </div>
            </div>
            <button className="bg-[#0B2177] text-[#B6D8FF] text-xs font-semibold px-4 py-2 rounded-full">
              Withdraw
            </button>
          </div>
          <button className="absolute bottom-5 right-5 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Plus className="w-3 h-3 text-white font-bold" strokeWidth={3} />
            </span>
            Add Funds
          </button>
        </div>

        {/* Available Games */}
        <div>
          <h3 className="text-foreground font-semibold mb-3">Available Games</h3>
          <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
            <CarouselContent className="-ml-3">
              {games.map((g, i) => (
                <CarouselItem key={i} className="pl-3 basis-auto">
                  <div
                    className={`w-28 h-32 rounded-2xl bg-gradient-to-br ${g.bg} p-3 flex flex-col justify-between relative overflow-hidden`}
                  >
                    <img
                      src={g.icon}
                      alt={g.name}
                      loading="lazy"
                      className="w-12 h-12 absolute top-2 right-2 object-contain"
                    />
                    <div className="mt-auto">
                      <p className="text-white font-bold text-sm leading-tight whitespace-pre-line">
                        {g.name}
                      </p>
                      <p className="text-black text-[10px] mt-1">Play Computer</p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Create Challenge */}
        <button className="w-full bg-[#9FC8F6] text-white font-semibold py-4 rounded-full flex items-center  justify-between px-6">
          <span className="text-[#0B2177]">Create Challenge</span>
          <span className="w-7 h-7 rounded-full bg-[#385FF4] flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" strokeWidth={3} />
          </span>
        </button>

        {/* Join a Challenge */}
        <div className="bg-secondary rounded-2xl p-5">
          <h3 className="text-foreground font-semibold">Join a Challenge</h3>
          <p className="text-muted-foreground text-xs mt-1">
            Other Players have created random challenges,
            <br />
            You can join any of your choice.
          </p>
          <div className="mt-4 space-y-3">
            {joinChallenges.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-border pb-3 last:border-0"
              >
                <div>
                  <p className="text-foreground text-sm font-medium">{c.game}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{c.amount}</p>
                </div>
                <button className="bg-muted text-[#1688D1] text-xs font-medium px-5 py-1.5 rounded-full">
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Direct Challenge */}
        <div className="bg-secondary rounded-2xl p-5">
          <h3 className="text-foreground font-semibold">Direct Challenge</h3>
          <p className="text-muted-foreground text-xs mt-1">Players who invited you to a game</p>
          <div className="mt-4 space-y-3">
            {directChallenges.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-border pb-3 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">{c.game}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{c.amount}</p>
                </div>
                <p className="text-muted-foreground text-xs flex-1">{c.from}</p>
                {c.from && (
                  <button className="bg-muted text-[#1688D1] text-xs font-medium px-5 py-1.5 rounded-full">
                    Join
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
