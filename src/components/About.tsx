import { JSX } from "react";
import { HOW_IT_WORKS } from "../data";

export default function About(): JSX.Element {
  return (
    <section className="bg-white px-6 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Long about text */}
        <div className="space-y-4 mb-12">
          <p className="text-gray-700 text-sm leading-relaxed">
            Kimo Games is an exciting gaming community where players can enjoy their favourite
            games, connect with others, and win amazing rewards — all completely free.
          </p>

          <p className="text-gray-700 text-sm leading-relaxed">
            At Kimo Games, players do not need to pay to play. Instead, they earn coins through
            gameplay and participation, which can be redeemed for valuable rewards such as cash,
            airtime, data subscriptions, food items, books, and tech gadgets including EarPods,
            earphones, chargers, headphones, speakers, and much more.
          </p>

          <p className="text-gray-700 text-sm leading-relaxed">
            Beyond gaming, Kimo Games is designed to create a vibrant digital community that
            promotes recreation, relaxation, social connection, and mental wellness.
          </p>

          <p className="text-gray-700 text-sm leading-relaxed">
            Our vision goes beyond rewards. We are committed to creating opportunities that empower
            our community members and improve everyday living.
          </p>

          <p className="text-gray-700 text-sm leading-relaxed">
            By combining fun, technology, and impact, Kimo Games is building a platform where
            entertainment meets opportunity.
          </p>
        </div>

        {/* How it works */}
        <div className="flex flex-col md:flex-row items-start justify-center gap-0 divide-x divide-gray-100">
          {HOW_IT_WORKS.map((item: { icon: string; title: string; sub: string }) => (
            <div
              key={item.title}
              className="flex-1 flex flex-col items-center text-center px-10 py-6"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 text-2xl">
                {item.icon}
              </div>

              <p className="font-bold text-sm text-gray-900 mb-1">{item.title}</p>

              <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">
                {item.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
