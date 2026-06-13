export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <label className={`inline-flex items-center gap-3 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-accent-success" : "bg-border-subtle"}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-bg-elevated shadow transition-transform ${checked ? "left-5" : "left-0.5"}`}
        />
      </button>
      {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
    </label>
  );
}

export function ColorInput({ label, value, onChange, className = "" }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-2 block text-sm font-medium text-text-secondary">{label}</span>}
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={onChange}
          className="h-11 w-14 cursor-pointer rounded-lg border border-border-subtle bg-bg-elevated p-1"
        />
        <span className="font-mono text-sm text-text-muted">{value}</span>
      </div>
    </label>
  );
}
