import type { GameGenre } from "@/data";

interface GameCardProps {
  game: GameGenre;
}

export default function GameCard({ game }: GameCardProps) {
  const { name, img } = game;

  return (
    <article className="group relative min-h-28 overflow-hidden rounded-xl">
      <img
        src={img}
        alt={name}
        loading="lazy"
        className="block h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <span className="absolute bottom-2.5 left-0 right-0 px-2 text-center text-sm font-bold tracking-wide text-white drop-shadow">
        {name}
      </span>
    </article>
  );
}
