import { Search } from "lucide-react";

export function SearchInput({ value, onChange, placeholder = "Search…", className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full min-h-11 rounded-lg border border-border-subtle bg-bg-elevated py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
      />
    </div>
  );
}

export function PageToolbar({ children, className = "" }) {
  return <div className={`mb-6 flex flex-wrap items-center gap-3 ${className}`}>{children}</div>;
}
