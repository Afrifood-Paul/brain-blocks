// /* eslint-disable prettier/prettier */
// import { useState } from "react";
// import { ShoppingCart } from "lucide-react";
// import { NAV_LINKS } from "../data";
// import { useNavigate } from "@tanstack/react-router";

// interface NavbarProps {
//   cartCount: number;
//   onCartClick: () => void;
// }

// export default function Navbar({ cartCount, onCartClick }: NavbarProps) {
//   const [active, setActive] = useState<string>("Home");
//     const navigate = useNavigate();

//   return (
//     <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
//       <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
//         <div className="flex items-center gap-2">
//           <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
//             <span className="text-lg font-black leading-none text-white">K</span>
//           </div>
//           <span className="text-xl font-black tracking-tight text-gray-900">KIMO</span>
//         </div>

//         <div className="hidden items-center gap-7 md:flex">
//           {NAV_LINKS.map((link: string) => (
//             <button
//               key={link}
//               onClick={() => setActive(link)}
//               className={`
//                 text-sm pb-0.5 border-b-2 cursor-pointer bg-transparent transition-all duration-150
//                 ${
//                   active === link
//                     ? "font-bold text-indigo-600 border-indigo-600"
//                     : "font-medium text-gray-500 border-transparent hover:text-indigo-500 hover:border-indigo-300"
//                 }
//               `}
//             >
//               {link}
//             </button>
//           ))}
//         </div>

//         <div className="flex items-center gap-2">
//           <button   onClick={() => navigate({ to: "/login" })} className="hidden rounded-lg border border-indigo-500 bg-transparent px-4 py-2 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 sm:inline-flex">
//             Log in
//           </button>

//           <button   onClick={() => navigate({ to: "/register" })}  className="rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90">
//             Register
//           </button>

//           {/* <button
//             onClick={onCartClick}
//             className="relative ml-1 bg-transparent p-1.5 text-gray-500 transition-colors hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
//             aria-label="Open cart"
//           >
//             <ShoppingCart className="h-6 w-6" aria-hidden="true" />

//             {cartCount > 0 && (
//               <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
//                 {cartCount}
//               </span>
//             )}
//           </button> */}
//         </div>
//       </div>
//     </nav>
//   );
// }

/* eslint-disable prettier/prettier */
// import { useState } from "react";
// import { useNavigate } from "@tanstack/react-router";

// interface NavbarProps {
//   cartCount: number;
//   onCartClick: () => void;
// }

// // Update your links to match the exact casing of the design image if needed
// const NAV_LINKS = ["About KIMO Games", "Games", "Market Place"];

// export default function Navbar({ cartCount, onCartClick }: NavbarProps) {
//   const [active, setActive] = useState<string>("Games");
//   const navigate = useNavigate();

//   return (
//     // Changed to absolute with a transparent background to float directly on top of the background image slider
//     <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent w-full">
//       <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 sm:px-12 md:px-20 lg:px-32">
        
//         {/* --- Logo Space --- */}
//         <div className="flex flex-col leading-none cursor-pointer" onClick={() => navigate({ to: "/" })}>
//           <span className="text-2xl font-black tracking-wider text-white">KIMO</span>
//           <span className="text-[10px] font-bold tracking-[0.25em] text-blue-500 mt-0.5">GAMES</span>
//         </div>

//         {/* --- Navigation Links --- */}
//         <div className="hidden items-center gap-8 md:flex">
//           {NAV_LINKS.map((link: string) => (
//             <button
//               key={link}
//               onClick={() => setActive(link)}
//               className={`
//                 text-sm font-medium transition-all duration-150 cursor-pointer bg-transparent border-none
//                 ${
//                   active === link
//                     ? "text-white" // In the design, active doesn't have an underline, just solid clear white
//                     : "text-gray-300 hover:text-white"
//                 }
//               `}
//             >
//               {link}
//             </button>
//           ))}
//         </div>

//         {/* --- Authentication Actions --- */}
//         <div className="flex items-center gap-3">
          
//           {/* Sign Up Button (Solid Blue) */}
//           <button 
//             onClick={() => navigate({ to: "/register" })}  
//             className="rounded-lg bg-[#3b5cf6] hover:bg-[#2563eb] px-5 py-2 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/10"
//           >
//             Sign up
//           </button>

//           {/* Login Button (Transparent with a Border Line) */}
//           <button 
//             onClick={() => navigate({ to: "/login" })} 
//             className="rounded-lg border border-gray-400 bg-transparent px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-white/10"
//           >
//             Login
//           </button>

//         </div>
//       </div>
//     </nav>
//   );
// }

/* eslint-disable prettier/prettier */
// import { useState } from "react";
// import { useNavigate } from "@tanstack/react-router";

// interface NavbarProps {
//   cartCount: number;
//   onCartClick: () => void;
// }

// const NAV_LINKS = ["About KIMO Games", "Games", "Market Place"];

// export default function Navbar({ cartCount, onCartClick }: NavbarProps) {
//   const [active, setActive] = useState<string>("Games");
//   const navigate = useNavigate();

//   return (
//     // Changed to fixed top-0 to keep it locked to the top of the screen while scrolling
//     // added a subtle backdrop blur so it stays readable over text content further down the page
//     <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm md:backdrop-blur-none w-full transition-all duration-300">
//       <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 sm:px-12 md:px-20 lg:px-32">
        
//         {/* --- Logo Space --- */}
//         <div className="flex flex-col leading-none cursor-pointer" onClick={() => navigate({ to: "/" })}>
//           <span className="text-2xl font-black tracking-wider text-white">KIMO</span>
//           <span className="text-[10px] font-bold tracking-[0.25em] text-blue-500 mt-0.5">GAMES</span>
//         </div>

//         {/* --- Navigation Links --- */}
//         <div className="hidden items-center gap-8 md:flex">
//           {NAV_LINKS.map((link: string) => (
//             <button
//               key={link}
//               onClick={() => setActive(link)}
//               className={`
//                 text-sm font-medium transition-all duration-150 cursor-pointer bg-transparent border-none
//                 ${
//                   active === link
//                     ? "text-white"
//                     : "text-gray-300 hover:text-white"
//                 }
//               `}
//             >
//               {link}
//             </button>
//           ))}
//         </div>

//         {/* --- Authentication Actions --- */}
//         <div className="flex items-center gap-3">
//           <button 
//             onClick={() => navigate({ to: "/register" })}  
//             className="rounded-lg bg-[#3b5cf6] hover:bg-[#2563eb] px-5 py-2 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/10"
//           >
//             Sign up
//           </button>

//           <button 
//             onClick={() => navigate({ to: "/login" })} 
//             className="rounded-lg border border-gray-400 bg-transparent px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-white/10"
//           >
//             Login
//           </button>
//         </div>

//       </div>
//     </nav>
//   );
// }

/* eslint-disable prettier/prettier */
// import { useState, useEffect } from "react";
// import { useNavigate } from "@tanstack/react-router";

// interface NavbarProps {
//   cartCount: number;
//   onCartClick: () => void;
// }

// const NAV_LINKS = ["About KIMO Games", "Games", "Market Place"];

// export default function Navbar({ cartCount, onCartClick }: NavbarProps) {
//   const [active, setActive] = useState<string>("Games");
//   const [isScrolled, setIsScrolled] = useState<boolean>(false);
//   const navigate = useNavigate();

//   // Listen to scroll events to toggle background state
//   useEffect(() => {
//     const handleScroll = () => {
//       if (window.scrollY > 20) {
//         setIsScrolled(true);
//       } else {
//         setIsScrolled(false);
//       }
//     };

//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   return (
//     <nav
//       className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ease-in-out ${
//         isScrolled
//           ? "bg-[#0a0f1d]/75 backdrop-blur-md shadow-lg h-20" // Scrolled state: rich dark tint + background content blur
//           : "bg-transparent backdrop-blur-0 h-24"           // Top state: perfectly transparent
//       }`}
//     >
//       <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 sm:px-12 md:px-20 lg:px-32 transition-all duration-500">
        
//         {/* --- Logo Space --- */}
//         <div className="flex flex-col leading-none cursor-pointer" onClick={() => navigate({ to: "/" })}>
//           <span className="text-2xl font-black tracking-wider text-white">KIMO</span>
//           <span className="text-[10px] font-bold tracking-[0.25em] text-blue-500 mt-0.5">GAMES</span>
//         </div>

//         {/* --- Navigation Links --- */}
//         <div className="hidden items-center gap-8 md:flex">
//           {NAV_LINKS.map((link: string) => (
//             <button
//               key={link}
//               onClick={() => setActive(link)}
//               className={`
//                 text-sm font-medium transition-all duration-150 cursor-pointer bg-transparent border-none
//                 ${
//                   active === link
//                     ? "text-white"
//                     : "text-gray-300 hover:text-white"
//                 }
//               `}
//             >
//               {link}
//             </button>
//           ))}
//         </div>

//         {/* --- Authentication Actions --- */}
//         <div className="flex items-center gap-3">
//           <button 
//             onClick={() => navigate({ to: "/register" })}  
//             className="rounded-lg bg-[#3b5cf6] hover:bg-[#2563eb] px-5 py-2 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/10"
//           >
//             Sign up
//           </button>

//           <button 
//             onClick={() => navigate({ to: "/login" })} 
//             className="rounded-lg border border-gray-400 bg-transparent px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-white/10"
//           >
//             Login
//           </button>
//         </div>

//       </div>
//     </nav>
//   );
// }


/* eslint-disable prettier/prettier */
// import { useState, useEffect } from "react";
// import { useNavigate } from "@tanstack/react-router";

// interface NavbarProps {
//   cartCount: number;
//   onCartClick: () => void;
// }

// const NAV_LINKS = ["About KIMO Games", "Games", "Market Place"];

// export default function Navbar({ cartCount, onCartClick }: NavbarProps) {
//   const [active, setActive] = useState<string>("Games");
//   const [isScrolled, setIsScrolled] = useState<boolean>(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const handleScroll = () => {
//       if (window.scrollY > 20) {
//         setIsScrolled(true);
//       } else {
//         setIsScrolled(false);
//       }
//     };

//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   return (
//     <nav
//       className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ease-in-out ${
//         isScrolled
//           ? "bg-white/[0.03] backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] h-20" 
//           : "bg-transparent backdrop-blur-none border-b border-transparent h-24"
//       }`}
//     >
//       <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 sm:px-12 md:px-20 lg:px-32">
        
//         {/* --- Logo Space --- */}
//         <div className="flex flex-col leading-none cursor-pointer" onClick={() => navigate({ to: "/" })}>
//           <span className="text-2xl font-black tracking-wider text-white">KIMO</span>
//           <span className="text-[10px] font-bold tracking-[0.25em] text-blue-500 mt-0.5">GAMES</span>
//         </div>

//         {/* --- Navigation Links --- */}
//         <div className="hidden items-center gap-8 md:flex">
//           {NAV_LINKS.map((link: string) => (
//             <button
//               key={link}
//               onClick={() => setActive(link)}
//               className={`
//                 text-sm font-medium transition-all duration-150 cursor-pointer bg-transparent border-none
//                 ${
//                   active === link
//                     ? "text-white"
//                     : "text-gray-300 hover:text-white"
//                 }
//               `}
//             >
//               {link}
//             </button>
//           ))}
//         </div>

//         {/* --- Authentication Actions --- */}
//         <div className="flex items-center gap-3">
//           <button 
//             onClick={() => navigate({ to: "/register" })}  
//             className="rounded-lg bg-[#3b5cf6] hover:bg-[#2563eb] px-5 py-2 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/10"
//           >
//             Sign up
//           </button>

//           <button 
//             onClick={() => navigate({ to: "/login" })} 
//             className="rounded-lg border border-gray-400 bg-transparent px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-white/10"
//           >
//             Login
//           </button>
//         </div>

//       </div>
//     </nav>
//   );
// }

/* eslint-disable prettier/prettier */
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import kimoGames from '../assets/kimo-games.svg'

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
}

const NAV_LINKS = ["About KIMO Games", "Games", "Market Place"];

export default function Navbar({ cartCount, onCartClick }: NavbarProps) {
  const [active, setActive] = useState<string>("Games");
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ease-in-out ${
        isScrolled
          ? "bg-slate-950/40 backdrop-blur-xl border-b border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-20"
          : "bg-transparent backdrop-blur-none border-b border-transparent h-24"
      }`}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 sm:px-12 md:px-20 lg:px-20">
        {/* --- Logo Space --- */}
        <a href="">
          <img src={kimoGames} alt="" className="w-[115.36px] h-[31.28px] object-contain -ml-3.5"  />
        </a>
        {/* <div className="flex flex-col leading-none cursor-pointer" onClick={() => navigate({ to: "/" })}>
       
        </div> */}

        {/* --- Navigation Links --- */}
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link: string) => (
            <button
              key={link}
              onClick={() => setActive(link)}
              className={`
                text-sm font-medium transition-all duration-150 cursor-pointer bg-transparent border-none
                ${active === link ? "text-white" : "text-gray-300 hover:text-white"}
              `}
            >
              {link}
            </button>
          ))}
        </div>

        {/* --- Authentication Actions --- */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/register" })}
            className="rounded-[8px] bg-[#3b5cf6] hover:bg-[#2563eb] px-5 py-2 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/10"
          >
            Sign up
          </button>

          <button
            onClick={() => navigate({ to: "/login" })}
            className="rounded-[8px] border border-gray-400 bg-transparent px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-white/10"
          >
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}