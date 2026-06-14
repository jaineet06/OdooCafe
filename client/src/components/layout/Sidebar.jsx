import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Coffee,
  ClipboardList,
  Users,
  LayoutGrid,
  Package,
  Tags,
  CreditCard,
  Ticket,
  Monitor,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const ICON = { size: 18, strokeWidth: 1.75 };

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
    isActive
      ? "bg-accent-primary/12 text-accent-primary"
      : "text-text-secondary hover:bg-bg-sunken hover:text-text-primary"
  }`;

function NavItem({ to, label, icon: Icon, collapsed, end }) {
  return (
    <NavLink to={to} end={end} className={linkClass} title={collapsed ? label : undefined}>
      <Icon {...ICON} className="shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

function NavGroup({ label, items, collapsed }) {
  if (collapsed) return items.map((item) => <NavItem key={item.to} {...item} collapsed />);
  return (
    <div className="mb-2">
      <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItem key={item.to} {...item} collapsed={false} />
        ))}
      </div>
    </div>
  );
}

const adminNav = [
  { type: "link", to: "/admin/reports", label: "Dashboard", icon: BarChart3 },
  {
    type: "group",
    label: "Catalog",
    items: [
      { to: "/admin/products", label: "Products", icon: Package },
      { to: "/admin/categories", label: "Categories", icon: Tags },
    ],
  },
  {
    type: "group",
    label: "Setup",
    items: [
      { to: "/admin/payment-methods", label: "Payment Methods", icon: CreditCard },
      { to: "/admin/floors", label: "Floors & Tables", icon: LayoutGrid },
      { to: "/admin/coupons", label: "Coupons & Promotions", icon: Ticket },
    ],
  },
  {
    type: "group",
    label: "Team",
    items: [
      { to: "/admin/users", label: "Employees", icon: Users },
      { to: "/admin/kds-register", label: "Kitchen Display", icon: Monitor },
    ],
  },
  { type: "link", to: "/pos/order", label: "Open POS", icon: Coffee },
];

const posNav = [
  { to: "/pos/order", label: "POS Order", icon: Coffee },
  { to: "/pos/orders", label: "Orders", icon: ClipboardList },
  { to: "/pos/tables", label: "Table View", icon: LayoutGrid },
  { to: "/pos/kitchen-status", label: "Kitchen Status", icon: Monitor },
];

export function Sidebar({ variant, collapsed, onToggleCollapse, mobileOpen, onMobileClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  function SidebarPanel({ isCollapsed }) {
    return (
      <aside
        className="flex h-full w-full flex-col overflow-x-hidden border-r border-border-subtle bg-bg-elevated"
      >
        <div className="flex h-14 items-center justify-between border-b border-border-subtle px-3 shrink-0">
          {!isCollapsed && <span className="truncate font-display text-lg text-brand-espresso whitespace-nowrap">Odoo Cafe</span>}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-lg p-2 text-text-muted hover:bg-bg-sunken md:block"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight {...ICON} /> : <ChevronLeft {...ICON} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {variant === "admin" &&
            adminNav.map((entry) =>
              entry.type === "group" ? (
                <NavGroup key={entry.label} label={entry.label} items={entry.items} collapsed={isCollapsed} />
              ) : (
                <NavItem key={entry.to} {...entry} collapsed={isCollapsed} />
              )
            )}

          {variant === "pos" && (
            <>
              {isAdmin && (
                <div className="mb-3 border-b border-border-subtle pb-3">
                  <NavItem to="/admin/reports" label="Back to Admin" icon={ArrowLeft} collapsed={isCollapsed} />
                </div>
              )}
              {posNav.map((item) => (
                <NavItem key={item.to} {...item} collapsed={isCollapsed} />
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-border-subtle p-3">
          {!isCollapsed && user?.name && (
            <p className="mb-2 truncate px-3 text-sm text-text-muted">{user.name}</p>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-accent-danger hover:bg-accent-danger/8 ${isCollapsed ? "justify-center" : ""}`}
            title={isCollapsed ? "Log out" : undefined}
          >
            <LogOut {...ICON} />
            {!isCollapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>
    );
  }

  return (
    <>
      <div className={`sticky top-0 hidden h-screen shrink-0 md:flex transition-[width] duration-200 ease-in-out ${collapsed ? "w-[4.25rem]" : "w-56"}`}>
        <SidebarPanel isCollapsed={collapsed} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-text-primary/40" aria-label="Close menu" onClick={onMobileClose} />
          <div className="relative h-full w-56">
            <SidebarPanel isCollapsed={false} />
          </div>
        </div>
      )}
    </>
  );
}
