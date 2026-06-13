import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../../context/AuthContext";
import { PageTransition } from "./PageTransition";

export function AdminLayout({ children, title, actions, wide = false }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar
        variant="admin"
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b border-border-subtle bg-bg-elevated px-4 md:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-text-muted hover:bg-bg-sunken md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} strokeWidth={1.75} />
          </button>
          {title && <h1 className="font-display text-xl text-brand-espresso md:text-2xl">{title}</h1>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
          <div className="ml-auto text-sm text-text-muted">{user?.name}</div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-6">
          <PageTransition depKey={title}>
            <div className={`mx-auto ${wide ? "max-w-7xl" : "max-w-5xl"}`}>{children}</div>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
