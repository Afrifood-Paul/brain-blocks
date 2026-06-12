import { MARKET_ITEMS } from "../../data";
import MarketItem from "./MarketItem";

interface MarketPlaceProps {
  onAdd: () => void;
}

export default function MarketPlace({ onAdd }: MarketPlaceProps) {
  return (
    <section className="py-14 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Market Place</h2>

          <button className="shrink-0 bg-transparent text-xs font-semibold text-indigo-600 hover:underline">
            Browse all items
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MARKET_ITEMS.map((item) => (
            <MarketItem key={item.name} item={item} onAdd={onAdd} />
          ))}
        </div>
      </div>
    </section>
  );
}
