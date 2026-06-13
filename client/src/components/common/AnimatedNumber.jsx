export function AnimatedNumber({ value, format = (n) => n.toLocaleString(), className = "" }) {
  const num = typeof value === "number" ? value : parseFloat(value) || 0;
  return <span className={className}>{format(num)}</span>;
}
