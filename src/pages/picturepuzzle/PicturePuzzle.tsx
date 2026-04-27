import React from "react";
import puzzleImg from "@/assets/puzzleImg.jpg";

export default function PicturePuzzle() {
  const tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const visible = new Set([0, 1, 2, 3, 6, 8]);

  return (
    <main className="min-h-screen bg-black flex items-start justify-center px-4 py-6">
      <section className="w-full max-w-xs flex flex-col items-center text-white">
        <div className="w-full flex items-center justify-between gap-3">
          <button  className="bg-tab-active px-4 py-1 text-foreground border border-primary/60">
            Picture Puzzle
          </button>

          <div className="text-right leading-tight">
            <p className="text-[10px] text-gray-300">Count Down</p>
            <p className="text-3xl font-bold leading-none">10:00</p>
            <p className="text-[10px] text-gray-300">Minutes</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-0.5 w-60 h-60">
          {tiles.map((i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            return visible.has(i) ? (
              <div
                key={i}
                className="bg-cover"
                style={{
                  backgroundImage: `url(${puzzleImg})`,
                  backgroundSize: "300% 300%",
                  backgroundPosition: `${col * 50}% ${row * 50}%`,
                }}
              />
            ) : (
              <div key={i} className="bg-red-300" />
            );
          })}
        </div>

        <div className="w-full flex justify-end mt-2">
          <div
            className="w-8 h-8 border border-gray-500 bg-cover"
            style={{ backgroundImage: `url(${puzzleImg})` }}
          />
        </div>

        <p className="mt-3 text-[10px] text-gray-400 text-center">
         <span className="font-bold"> Hint:</span> Click and move tiles around till correct image is formed
        </p>

        <button className="mt-5 w-full bg-blue-600 hover:cursor-pointer hover:opacity-90 rounded-full py-3 font-semibold">
          Start
        </button>
      </section>
    </main>
  );
}
