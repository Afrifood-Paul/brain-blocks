/* eslint-disable prettier/prettier */
import { JSX } from "react";
import { HOW_IT_WORKS } from "../data";

export default function About(): JSX.Element {
  return (
    <section className="bg-white px-6 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Long about text */}
        <h3 className="text-[#181818] text-[36px] font-semibold leading-[140%] mb-6 mt-12">
          About Kimo Games
        </h3>
        <div className="space-y-4 mb-12 flex flex-col gap-3">
          <p className="text-[#323232] text-[18px] font-normal leading-[150%]">
            Kimo Games is an exciting gaming community where players can enjoy their favourite
            games, connect with others, and win amazing rewards — all completely free.
          </p>

          <p className="text-[#323232] text-[18px] font-normal leading-[150%]">
            At Kimo Games, players do not need to pay to play. Instead, they earn coins through
            gameplay and participation, which can be redeemed for valuable rewards such as cash,
            airtime, data subscriptions, food items, books, and tech gadgets including EarPods,
            earphones, chargers, headphones, speakers, and much more.
          </p>

          <p className="text-[#323232] text-[18px] font-normal leading-[150%]">
            Beyond gaming, Kimo Games is designed to create a vibrant digital community that
            promotes recreation, relaxation, social connection, and mental wellness. We believe
            gaming should not only be entertaining, but also meaningful — helping people take
            healthy breaks, reduce stress, combat depression, and build positive relationships
            within a supportive tribe.
          </p>

          <p className="text-[#323232] text-[18px] font-normal leading-[150%]">
            Our vision goes beyond rewards. We are committed to creating opportunities that empower
            our community members and improve everyday living. Through innovation and community
            engagement, Kimo Games aligns with key United Nations Sustainable Development Goals,
            including: No Poverty, Zero Hunger, Quality Education, Decent Work and Economic Growth
          </p>

          <p className="text-[#323232] text-[18px] font-normal leading-[150%]">
            By combining fun, technology, and impact, Kimo Games is building a platform where
            entertainment meets opportunity — helping players relax, network, grow, and move closer
            to achieving their personal life goals.
          </p>
        </div>

        {/* How it works */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0 mt-16">
          {HOW_IT_WORKS.map((item: { icon: string; title: string; sub: string }) => (
            <div
              key={item.title}
              className="flex-1 flex flex-col items-center text-center px-10 py-6"
            >
              <div className="w-24 h-24 rounded-full bg-[#D8DAFD] flex items-center justify-center mb-4 text-2xl">
                <img src={item.icon} alt="" className="w-14 h-14" />
              </div>

              <p className="font-bold text-xl text-[#181818] mb-1">{item.title}</p>

              <p className="text-[18px] text-[#323232] leading-relaxed whitespace-pre-line">
                {item.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
