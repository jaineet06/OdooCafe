import { usePageEnter } from "../../hooks/useGsapAnimation";

export function PageTransition({ children, depKey }) {
  const ref = usePageEnter([depKey]);
  return <div ref={ref}>{children}</div>;
}
