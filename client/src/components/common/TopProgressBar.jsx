import { useIsFetching } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export function TopProgressBar() {
  const isFetching = useIsFetching();
  const barRef = useRef(null);
  const active = isFetching > 0;

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    if (active) {
      gsap.to(bar, { scaleX: 0.7, duration: 8, ease: "power1.out" });
    } else {
      gsap.to(bar, { scaleX: 1, duration: 0.25, ease: "power2.out", onComplete: () => {
        gsap.set(bar, { scaleX: 0 });
      }});
    }
  }, [active]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 bg-transparent">
      <div
        ref={barRef}
        className="h-full origin-left bg-accent-primary"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
