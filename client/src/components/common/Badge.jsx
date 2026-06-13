const STYLES = {
  neutral: "bg-bg-sunken text-text-secondary",
  primary: "bg-accent-primary/12 text-accent-primary",
  success: "bg-accent-success/15 text-accent-success",
  warning: "bg-accent-warning/15 text-accent-warning",
  danger: "bg-accent-danger/12 text-accent-danger",
  info: "bg-accent-info/12 text-accent-info",
};

export function Badge({ children, variant = "neutral", className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${STYLES[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusPill({ status, label, className = "" }) {
  const variantMap = {
    draft: "warning",
    paid: "success",
    cancelled: "danger",
    occupied: "warning",
    available: "success",
    inactive: "neutral",
    to_cook: "warning",
    preparing: "info",
    completed: "success",
  };
  const variant = variantMap[status] || "neutral";
  const display = label || status?.replace(/_/g, " ");

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${STYLES[variant]} ${className}`}>
      {display}
    </span>
  );
}

export function OrderStatusPill({ paymentStatus, kdsStage, className = "" }) {
  const kdsLabels = { to_cook: "To cook", preparing: "Preparing", completed: "Kitchen done" };
  return (
    <span className={`inline-flex flex-wrap gap-1 ${className}`}>
      <StatusPill status={paymentStatus} />
      {kdsStage && paymentStatus !== "cancelled" && (
        <StatusPill status={kdsStage} label={kdsLabels[kdsStage] || kdsStage} />
      )}
    </span>
  );
}
