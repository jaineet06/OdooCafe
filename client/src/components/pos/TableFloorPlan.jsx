import { useState, useEffect } from "react";
import { Users, Link as LinkIcon, RefreshCw } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";
import { StatusPill } from "../common/Badge";

export function TableFloorPlan({
  grouped,
  onSelectTable,
  stats,
  isMergeMode,
  selectedTableIds = [],
  onToggleOccupancy,
  onUnmerge
}) {
  const [now, setNow] = useState(Date.now());

  // Recompute seating elapsed time every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

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
              className="grid gap-6 justify-items-center sm:justify-items-start"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}
            >
              {floorTables.map((t) => (
                <TableTile
                  key={t.id}
                  table={t}
                  onSelect={() => onSelectTable(t)}
                  isSelected={selectedTableIds.includes(t.id)}
                  isMergeMode={isMergeMode}
                  onToggleOccupancy={onToggleOccupancy}
                  onUnmerge={onUnmerge}
                  now={now}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function TableTile({
  table: t,
  onSelect,
  isSelected,
  isMergeMode,
  onToggleOccupancy,
  onUnmerge,
  now
}) {
  const occupied = t.is_occupied;
  const seats = Number(t.seats) || 4;
  const shape = t.shape || "square";
  const isMerged = !!t.merge_primary_id;
  const isPrimary = isMerged && t.merge_primary_id === t.id;

  // Visual layout based on shape
  let w = 110;
  let h = 110;
  let borderRadius = "16px";

  if (shape === "round") {
    w = Math.min(140, 100 + seats * 8);
    h = w;
    borderRadius = "50%";
  } else if (shape === "rectangle") {
    w = Math.min(160, 110 + seats * 10);
    h = 85;
    borderRadius = "8px";
  } else {
    // square
    w = Math.min(130, 100 + seats * 6);
    h = w;
    borderRadius = "16px";
  }

  // Seated time progress bar calculation
  let elapsedMinutes = 0;
  let progressColor = "#22c55e"; // Vibrant Green (0-20 min)

  if (occupied && t.occupied_since) {
    elapsedMinutes = (now - new Date(t.occupied_since).getTime()) / 60000;
    if (elapsedMinutes > 20 && elapsedMinutes <= 40) {
      progressColor = "#f97316"; // Vibrant Orange (20-40 min)
    } else if (elapsedMinutes > 40) {
      progressColor = "#ef4444"; // Vibrant Red (40+ min)
    }
  }

  // Border & background styling
  let borderColor = "var(--color-accent-success)";
  let borderStyle = "solid";
  let borderWidth = "2px";
  let background = "linear-gradient(145deg, rgba(107,127,107,0.15), rgba(107,127,107,0.05))";

  if (isSelected) {
    borderColor = "var(--color-accent-primary)";
    borderWidth = "4px";
    background = "rgba(194, 91, 58, 0.25)";
    if (isMerged) {
      borderStyle = "dashed";
    }
  } else if (occupied) {
    borderColor = "var(--color-accent-primary)";
    background = "linear-gradient(145deg, rgba(194,91,58,0.15), rgba(194,91,58,0.05))";
    if (isMerged) {
      borderStyle = "dashed";
    }
  } else if (isMerged) {
    borderColor = "var(--color-accent-info)";
    borderStyle = "dashed";
    background = "linear-gradient(145deg, rgba(90,122,138,0.12), rgba(90,122,138,0.04))";
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={!t.is_active}
        onClick={onSelect}
        className="group relative flex flex-col items-center justify-center border transition-all duration-200 hover:shadow-lg disabled:opacity-40 cursor-pointer overflow-hidden"
        style={{
          width: w,
          height: h,
          borderRadius,
          borderColor,
          borderStyle,
          borderWidth,
          background,
        }}
      >
        {/* Time-Seated Progress Bar */}
        {occupied && t.occupied_since && (
          <div className="absolute top-0 left-0 right-0 h-2.5 bg-black/15 overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-r-md"
              style={{
                width: `${Math.min(100, (elapsedMinutes / 60) * 100)}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>
        )}

        {/* Table Details */}
        <span className="font-display text-2xl text-brand-espresso flex items-center gap-1">
          {isMerged && <LinkIcon size={14} className="text-accent-info" />}
          #{t.table_number}
        </span>
        
        <span className="flex items-center gap-1 text-xs text-text-muted">
          <Users size={12} /> {t.combined_seats || t.seats}
        </span>
        
        {occupied && t.draft_order_total && (
          <span className="mt-1 text-xs font-bold text-accent-primary">
            {formatCurrency(t.draft_order_total)}
          </span>
        )}
      </button>

      {/* Manual Occupancy & Merge Controls (Visible in Normal Mode) */}
      {!isMergeMode && t.is_active && (
        <div className="flex flex-col gap-1 items-center w-full">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onToggleOccupancy(t)}
              className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-bg-elevated hover:bg-border-subtle transition-colors text-text-secondary border border-border-subtle cursor-pointer"
            >
              {occupied ? "Vacate" : "Occupy"}
            </button>
            
            {isMerged && (
              <button
                type="button"
                onClick={() => onUnmerge(t)}
                className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-accent-danger/10 hover:bg-accent-danger hover:text-white transition-colors text-accent-danger border border-accent-danger/20 cursor-pointer"
                title="Unmerge group"
              >
                Split
              </button>
            )}
          </div>
          <StatusPill status={occupied ? "occupied" : "available"} />
        </div>
      )}

      {isMergeMode && (
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
          isSelected ? "bg-accent-primary text-white" : "bg-bg-sunken text-text-muted"
        }`}>
          {isSelected ? "Selected" : "Select"}
        </span>
      )}
    </div>
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

