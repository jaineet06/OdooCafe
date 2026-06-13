import { useState } from "react";
import { Plus } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";
import { resolveProductImage } from "../../utils/unsplash";

const FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='160' viewBox='0 0 200 160'%3E%3Crect fill='%23ebe4d8' width='200' height='160'/%3E%3C/svg%3E";

export function ProductCard({ product, color, onAdd }) {
  const [imgSrc, setImgSrc] = useState(() => resolveProductImage(product));

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onAdd(product)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAdd(product);
        }
      }}
      className="product-card group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-bg-elevated text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative flex flex-1 items-center justify-center bg-bg-sunken/50 px-4 pt-6 pb-2">
        <img
          src={imgSrc}
          alt={product.name}
          className="h-28 w-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={() => setImgSrc(FALLBACK)}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdd(product);
          }}
          className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-brand-espresso text-bg-elevated shadow-md"
          aria-label={`Add ${product.name}`}
        >
          <Plus size={18} strokeWidth={2} />
        </button>
      </div>
      <div className="border-t border-border-subtle/60 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-sm font-semibold text-text-primary">{product.name}</h3>
            {product.category_name && (
              <span
                className="mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: color }}
              >
                {product.category_name}
              </span>
            )}
          </div>
          <p className="shrink-0 font-display text-base text-accent-primary">{formatCurrency(product.price)}</p>
        </div>
      </div>
    </div>
  );
}
