import type { MarketItemData } from "@/data";

interface MarketItemProps {
  item: MarketItemData;
  onAdd: () => void;
}

export default function MarketItem({ item, onAdd }: MarketItemProps) {
  const { name, coins, category, img } = item;

  return (
    <article className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative">
        <img
          src={img}
          alt={name}
          loading="lazy"
          className="block h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <button
          onClick={onAdd}
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-gray-700 shadow-md transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label={`Add ${name}`}
        >
          +
        </button>
      </div>

      <div className="p-3">
        <p className="mb-0.5 truncate text-sm font-bold text-gray-900">{name}</p>

        <p className="mb-2 text-[11px] font-semibold text-indigo-600">{coins}</p>

        <div className="flex items-center justify-between">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
            {category}
          </span>

          <button
            onClick={onAdd}
            className="rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-3 py-1 text-[10px] font-bold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Redeem
          </button>
        </div>
      </div>
    </article>
  );
}
