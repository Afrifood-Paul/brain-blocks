/* eslint-disable prettier/prettier */
import { JSX } from "react";
import { GAME_GENRES } from "../../data";
import GameCard from "./GameCard";

export default function GamesGenre(): JSX.Element {
  return (
    <section className="bg-white px-4 pb-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Games Genres</h2>

          <button className="shrink-0 bg-transparent text-xs font-semibold text-indigo-600 hover:underline">
            See all genres
          </button>
        </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {GAME_GENRES.map((game) => (
              <GameCard key={game.name} game={game} />
            ))}
          </div>
      </div>
    </section>
  );
}
