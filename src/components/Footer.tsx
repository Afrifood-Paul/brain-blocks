/* eslint-disable prettier/prettier */
import { JSX } from "react";
import { FOOTER_COLS } from "../data";
import exStoreLogo from '../assets/exStore-logo.svg'
import instagramLogo from "../assets/instagram.svg";
import youtubeLogo from "../assets/youtube.svg";
import chatIcon from "../assets/footer-chatIcon.svg";
import twitterLogo from "../assets/twitter.svg";


const iconData: string[] = [instagramLogo, youtubeLogo, chatIcon, twitterLogo];

export default function Footer(): JSX.Element {
  return (
    <footer className="bg-[#0E0E0E] px-6 pt-14 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {" "}
          {/* Brand */}
          <div className="flex items-start">
            {/* <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                <span className="text-white font-black text-lg leading-none">eK</span>
              </div> */}
            <a href="http://">
              <img src={exStoreLogo} alt="" className="w-full h-full -mt-2.5 -ml-2.5" />
            </a>
            {/* <span className="text-white font-black text-lg leading-none">eK</span>
              <span className="font-black text-xl text-white">Store</span> */}
          </div>
          {/* <p className="text-gray-500 text-sm leading-relaxed max-w-[200px] mb-5">
              Africa's free-to-play gaming rewards platform. No deposit required — just play and
              win.
            </p> */}
          {/* Link columns */}
          {FOOTER_COLS.map((column: { title: string; links: string[] }) => (
            <div key={column.title}>
              <h4 className="text-[18px] font-bold text-[#F5F4F9] Capitalize leading-[150%] mb-4">
                {column.title}
              </h4>

              <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                {column.links.map((link: string) => (
                  <li key={link}>
                    <a href="#" className="text-[16px] text-[#A0A0A0] no-underline cursor-">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-[18px] font-bold text-[#F5F4F9] Capitalize leading-[150%] mb-4">
              Follow us on:
            </h4>
            <div className="flex gap-2 ">
              {iconData.map((icon: string) => (
                <a
                  key={icon}
                  className="inline-flex w-8 h-8 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs cursor-pointer hover:bg-white/10 transition-colors items-center justify-center p-2"
                >
                  <img src={icon} alt="" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex items-center justify-center">
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Exstore</p>
        </div>
      </div>
    </footer>
  );
}
