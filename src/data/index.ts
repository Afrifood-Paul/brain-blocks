export type GameGenre = {
  name: string;
  img: string;
};

export type MarketItemData = {
  name: string;
  coins: string;
  category: string;
  img: string;
};

import playIcon from "../assets/how-it-works-1.svg";
import coinIcon from "../assets/how-it-works-2.svg";
import rewardIcon from "../assets/how-it-works-3.svg";

export const NAV_LINKS = ["Home", "Blog", "Games", "Market", "Contact Us"] as const;

export const GAME_GENRES: GameGenre[] = [
  {
    name: "Ludo",
    img: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=300&h=200&fit=crop",
  },
  {
    name: "Chess",
    img: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=300&h=200&fit=crop",
  },
  {
    name: "Scrabble",
    img: "https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=300&h=200&fit=crop",
  },
  {
    name: "Puzzle",
    img: "https://images.unsplash.com/photo-1585504198199-20277593b94f?w=300&h=200&fit=crop",
  },
  {
    name: "Knowledge Test",
    img: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=300&h=200&fit=crop",
  },
  {
    name: "Sports",
    img: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&h=200&fit=crop",
  },
];

export const MARKET_ITEMS: MarketItemData[] = [
  {
    name: "EarPod",
    coins: "354 Coins",
    category: "Electronics",
    img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=220&fit=crop",
  },
  {
    name: "Airtime, Data, Utilities",
    coins: "354 Coins",
    category: "Services",
    img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=220&fit=crop",
  },
  {
    name: "HeadPhone",
    coins: "354 Coins",
    category: "Electronics",
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=220&fit=crop",
  },
  {
    name: "Power Bank",
    coins: "354 Coins",
    category: "Electronics",
    img: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=300&h=220&fit=crop",
  },
  {
    name: "Smart Watch",
    coins: "620 Coins",
    category: "Electronics",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=220&fit=crop",
  },
  {
    name: "Laptop",
    coins: "2000 Coins",
    category: "Electronics",
    img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=220&fit=crop",
  },
  {
    name: "Gaming Mouse",
    coins: "480 Coins",
    category: "Gaming",
    img: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=220&fit=crop",
  },
  {
    name: "Keyboard",
    coins: "560 Coins",
    category: "Gaming",
    img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=220&fit=crop",
  },
];

export const HOW_IT_WORKS = [
  {
    icon: playIcon,
    title: "Play Games",
    sub: "100% Free,\nNo Entry Fees",
  },
  {
    icon: coinIcon,
    title: "Earn Coins",
    sub: "Play Games,\nComplete Task",
  },
  {
    icon: rewardIcon,
    title: "Redeem Rewards",
    sub: "Convert to cash, airtime,\nGadgets & more",
  },
];

export const FOOTER_COLS = [
  { title: "Menu", links: ["Order tracking", "Store location", "Return policy", "Support"] },
  { title: "Resources", links: ["Blog", "Help center", "Documentation", "Guidelines"] },
  // { title: "Support", links: ["Help Center", "Contact Us", "Privacy Policy", "Terms"] },
];
