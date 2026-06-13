import { getUnsplashPlaceholder } from "../../utils/unsplash";

export function CategoryCard({ label, count, color, imageUrl, active, onClick }) {
  const bg = imageUrl || getUnsplashPlaceholder(label);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`category-card group relative h-28 min-w-[148px] shrink-0 overflow-hidden rounded-2xl text-left transition-all ${
        active
          ? "ring-2 ring-brand-espresso shadow-md"
          : "shadow-sm hover:-translate-y-0.5 hover:shadow-md"
      }`}
    >
      <img
        src={bg}
        alt=""
        className={`absolute inset-0 h-full w-full object-cover transition-opacity ${
          active ? "opacity-30" : "opacity-20 group-hover:opacity-30"
        }`}
      />
      <div
        className={`relative flex h-full flex-col justify-between p-4 ${
          active ? "bg-brand-espresso/90 text-bg-elevated" : "bg-bg-elevated/85"
        }`}
      >
        <span
          className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            active ? "bg-bg-elevated/20" : "bg-accent-success/15 text-accent-success"
          }`}
        >
          Available
        </span>
        <div>
          <p className="font-semibold leading-tight">{label}</p>
          <p className={`text-xs ${active ? "text-bg-elevated/80" : "text-text-muted"}`}>
            {count} item{count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      {color && !active && (
        <span
          className="absolute bottom-0 left-0 h-1 w-full"
          style={{ backgroundColor: color }}
        />
      )}
    </button>
  );
}
