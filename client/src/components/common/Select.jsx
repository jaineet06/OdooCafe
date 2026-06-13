export function Select({ label, error, children, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm font-medium text-text-secondary">{label}</span>}
      <select
        className={`w-full min-h-11 appearance-none rounded-lg border border-border-subtle bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 ${error ? "border-accent-danger" : ""} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="mt-1.5 block text-xs text-accent-danger">{error}</span>}
    </label>
  );
}
