const inputClass =
  "w-full min-h-11 rounded-lg border border-border-subtle bg-bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 disabled:opacity-50";

export function Input({ label, error, hint, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm font-medium text-text-secondary">{label}</span>}
      <input className={`${inputClass} ${error ? "border-accent-danger focus:border-accent-danger focus:ring-accent-danger/20" : ""} ${className}`} {...props} />
      {error && <span className="mt-1.5 block text-xs text-accent-danger">{error}</span>}
      {hint && !error && <span className="mt-1.5 block text-xs text-text-muted">{hint}</span>}
    </label>
  );
}

export function Textarea({ label, error, className = "", rows = 3, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm font-medium text-text-secondary">{label}</span>}
      <textarea
        rows={rows}
        className={`${inputClass} min-h-0 resize-y ${error ? "border-accent-danger" : ""} ${className}`}
        {...props}
      />
      {error && <span className="mt-1.5 block text-xs text-accent-danger">{error}</span>}
    </label>
  );
}
