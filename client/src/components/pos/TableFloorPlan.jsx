import { Users } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";
import { StatusPill } from "../common/Badge";

export function TableFloorPlan({ grouped, onSelectTable, stats }) {
  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-3">
        <Stat label="Available" value={stats.available} color="var(--color-accent-success)" />
        <Stat label="Occupied" value={stats.occupied} color="var(--color-accent-primary)" />
        <Stat label="Total" value={stats.total} color="var(--color-brand-espresso)" />
      </div>

      <div className="space-y-10 rounded-2xl bg-bg-sunken/30 p-6 lg:p-8">
        {grouped.map(([floorName, floorTables]) => (
          <section key={floorName}>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">{floorName}</h2>
            <div
              className="grid gap-6"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}
            >
              {floorTables.map((t) => (
                <TableTile key={t.id} table={t} onSelect={() => onSelectTable(t)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function TableTile({ table: t, onSelect }) {
  const occupied = t.order_status === "occupied";
  const seats = Number(t.seats) || 4;
  const isRound = seats <= 4;
  const w = Math.min(160, 100 + seats * 12);
  const h = isRound ? w : Math.max(90, w * 0.7);

  return (
    <button
      type="button"
      disabled={!t.is_active}
      onClick={onSelect}
      className="group flex flex-col items-center gap-3 disabled:opacity-40"
    >
      <div
        className="relative flex flex-col items-center justify-center border-2 transition-shadow hover:shadow-lg"
        style={{
          width: w,
          height: h,
          borderRadius: isRound ? "50%" : "16px",
          borderColor: occupied ? "var(--color-accent-primary)" : "var(--color-accent-success)",
          background: occupied
            ? "linear-gradient(145deg, rgba(194,91,58,0.15), rgba(194,91,58,0.05))"
            : "linear-gradient(145deg, rgba(107,127,107,0.15), rgba(107,127,107,0.05))",
        }}
      >
        <span className="font-display text-2xl text-brand-espresso">#{t.table_number}</span>
        <span className="flex items-center gap-1 text-xs text-text-muted">
          <Users size={12} /> {t.seats}
        </span>
        {occupied && t.draft_order_total && (
          <span className="mt-1 text-xs font-bold text-accent-primary">{formatCurrency(t.draft_order_total)}</span>
        )}
      </div>
      <StatusPill status={occupied ? "occupied" : "available"} />
    </button>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded-xl border border-border-subtle px-4 py-2" style={{ borderLeft: `4px solid ${color}` }}>
      <p className="font-display text-2xl" style={{ color }}>{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}
