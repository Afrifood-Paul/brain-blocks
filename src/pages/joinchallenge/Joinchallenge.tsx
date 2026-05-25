import React from "react";
import puzzleImg from "@/assets/puzzleImg.jpg";

const Joinchallenge = () => {
  const tiles = [
    { show: true },
    { show: false },
    { show: true },
    { show: false },
    { show: false },
    { show: false },
    { show: true },
    { show: false },
    { show: true },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-background px-4 py-5">
      <section className="mx-auto flex w-full max-w-md flex-col items-center">
        <h1 className="text-foreground w-full font-semibold text-base leading-snug">
          You are about to Join a Picture Puzzle
          <br />
          Challenge from <span>@akinyemi</span>
        </h1>

        <div className="mt-8 w-36 h-36 grid grid-cols-3 grid-rows-3 gap-0.5">
          {tiles.map((t, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            return t.show ? (
              <div
                key={i}
                className="bg-cover"
                style={{
                  backgroundImage: `url(${puzzleImg})`,
                  backgroundSize: "300% 300%",
                  backgroundPosition: `${(col / 2) * 100}% ${(row / 2) * 100}%`,
                }}
                aria-hidden
              />
            ) : (
              <div key={i} style={{ backgroundColor: "#e87363" }} aria-hidden />
            );
          })}
        </div>

        <div className="mt-10 w-full">
          <h2 className="text-foreground font-semibold text-base">How it works</h2>
          <p className="text-muted-foreground text-xs mt-2">
            The fastest person to arrange the picture in the correct order wins!
          </p>
        </div>

        <div className="mt-6 w-full bg-input rounded-full px-6 py-4">
          <span className="text-muted-foreground text-base">500 coins</span>
        </div>

        <p className="text-muted-foreground text-xs text-center mt-3">
          If you win the Challenge you will get 900 coins credited into your account
        </p>

        <button className="mt-6 w-full bg-primary text-primary-foreground font-semibold text-base py-4 rounded-full hover:opacity-90 transition-opacity">
          Accept Challenge
        </button>
      </section>
    </main>
  );
};

export default Joinchallenge;
