import { useEffect, useRef } from "react";
import { useCountUp } from "../../hooks/useGsapAnimation";

export function AnimatedNumber({ value, format = (n) => n.toLocaleString(), className = "" }) {
  const ref = useCountUp(typeof value === "number" ? value : parseFloat(value) || 0);
  return <span ref={ref} className={className}>{format(0)}</span>;
}

/** Currency count-up wrapper */
export function AnimatedCurrency({ value, formatter, className = "" }) {
  const numRef = useRef(null);
  const ref = useCountUp(typeof value === "number" ? value : 0);

  useEffect(() => {
    if (numRef.current && formatter) {
      // useCountUp sets textContent as integer — override for currency in parent via formatter on final
    }
  }, [value, formatter]);

  if (formatter) {
    return <span ref={ref} className={className}>{formatter(0)}</span>;
  }
  return <span ref={ref} className={className}>0</span>;
}
