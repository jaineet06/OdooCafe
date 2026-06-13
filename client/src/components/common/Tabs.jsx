export function Tabs({ items, value, onChange, className = "" }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} role="tablist">
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-brand-espresso text-bg-elevated"
                : "bg-bg-elevated text-text-secondary hover:bg-bg-sunken"
            }`}
            style={active && item.color ? { backgroundColor: item.color, color: "#fff" } : undefined}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
