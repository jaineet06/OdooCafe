export function Card({ children, className = "", padding = "md", interactive = false, accentColor, ...props }) {
  const pad = padding === "none" ? "" : padding === "sm" ? "p-4" : padding === "lg" ? "p-6" : "p-5";
  return (
    <div
      className={`rounded-xl border border-border-subtle bg-bg-elevated ${pad} ${
        interactive ? "cursor-pointer transition-transform hover:-translate-y-0.5" : ""
      } ${className}`}
      style={accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

export function ListRow({ children, className = "", accentColor, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl border border-border-subtle bg-bg-elevated p-4 text-left transition-colors hover:bg-bg-sunken/50 ${className}`}
      style={accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : undefined}
    >
      {children}
    </Tag>
  );
}
