import { useState } from "react";
import { Menu, Coffee } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../common/Badge";
import { PageTransition } from "./PageTransition";
import { SessionLockOverlay } from "./SessionLockOverlay";
import { PosOrderSync } from "../../hooks/usePosOrderSync";

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function PosLayout({
  children,
  tableLabel,
  searchSlot,
  headerVariant = "default",
  orderCount,
}) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isOrder = headerVariant === "order";

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar
        variant="pos"
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={`flex items-center gap-3 border-b border-border-subtle bg-bg-elevated px-4 ${
            isOrder ? "h-16" : "h-14"
          }`}
        >
          <button
            type="button"
            className="rounded-lg p-2 text-text-muted hover:bg-bg-sunken md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} strokeWidth={1.75} />
          </button>

          {isOrder ? (
            <div className="hidden shrink-0 sm:block">
              <div className="flex items-center gap-2">
                <Coffee size={20} className="text-accent-success" strokeWidth={1.75} />
                <span className="font-display text-lg text-brand-espresso">Odoo Cafe</span>
              </div>
              <p className="text-xs text-text-muted">{DATE_FMT.format(new Date())}</p>
            </div>
          ) : null}

          {searchSlot && (
            <div className={`flex flex-1 ${isOrder ? "max-w-xl justify-center" : "max-w-md justify-center"}`}>
              {searchSlot}
            </div>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-3">
            {isOrder && orderCount != null && (
              <span className="hidden text-sm text-text-muted sm:inline">
                Total: <strong className="text-brand-espresso">{orderCount}</strong> orders
              </span>
            )}
            {tableLabel && (
              <Badge variant="primary" className="hidden sm:inline-flex">
                {tableLabel}
              </Badge>
            )}
            <div className="text-right text-sm">
              <p className="font-medium text-text-primary">{user?.name}</p>
              <p className="text-xs capitalize text-text-muted">{user?.role}</p>
            </div>
          </div>
        </header>
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <SessionLockOverlay />
      <PosOrderSync />
    </div>
  );
}
