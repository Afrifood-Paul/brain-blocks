/* eslint-disable prettier/prettier */
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import GamesGenre from "@/components/GamesGenre/GamesGenre";
import MarketPlace from "@/components/MarketPlace/MarketPlace";
import Footer from "@/components/Footer";

export default function Home() {
  const [cartCount, setCartCount] = useState<number>(0);

  const addToCart = () => {
    setCartCount((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar cartCount={cartCount} onCartClick={() => {}} />

      <Hero />
      <About />
      <GamesGenre />

      <MarketPlace onAdd={addToCart} />

      <Footer />
    </div>
  );
}