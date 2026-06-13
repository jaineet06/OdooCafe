import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "bg-accent-primary text-bg-elevated hover:bg-accent-primary-hover",
  secondary: "bg-bg-sunken text-text-primary hover:bg-border-subtle",
  outline: "border-2 border-brand-espresso text-brand-espresso hover:bg-brand-espresso hover:text-bg-elevated",
  danger: "bg-accent-danger text-bg-elevated hover:opacity-90",
  ghost: "text-text-secondary hover:bg-bg-sunken hover:text-text-primary",
};

const SIZES = {
  sm: "min-h-9 px-3 text-xs",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-6 text-base",
};

const ICON_SIZES = { sm: 14, md: 18, lg: 20 };

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  icon: Icon,
  iconOnly = false,
  disabled,
  ...props
}) {
  const iconSize = ICON_SIZES[size];
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${iconOnly ? "!px-0 aspect-square min-w-11" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={iconSize} className="animate-spin" /> : Icon ? <Icon size={iconSize} strokeWidth={1.75} /> : null}
      {!iconOnly && children}
    </button>
  );
}
