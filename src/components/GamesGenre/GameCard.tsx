import type { GameGenre } from "@/data";

interface GameCardProps {
  game: GameGenre;
}

export default function GameCard({ game }: GameCardProps) {
  const { name, img } = game;

  return (
    <div className="relative w-full aspect-square rounded-[6px] overflow-hidden shadow-lg flex items-center justify-center group">
      <img
        src={img}
        alt={name}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-black/70 transition-opacity duration-300 group-hover:bg-black/40" />

      <span className="relative z-10 text-center text-2xl font-bold tracking-wide text-white drop-shadow-md">
        {name}
      </span>
    </div>
  );
}
