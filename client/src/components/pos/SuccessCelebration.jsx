import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Check } from "lucide-react";

export function SuccessCelebration({ onComplete }) {
  const overlayRef = useRef(null);
  const checkRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });

    tl.fromTo(
      overlayRef.current,
      { backgroundColor: "rgba(255, 255, 255, 0)", opacity: 1 },
      { backgroundColor: "rgba(255, 255, 255, 0.95)", duration: 0.25, ease: "power2.out" }
    )
    .fromTo(
      circleRef.current,
      { scale: 0.3, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2)" },
      "-=0.15"
    )
    .fromTo(
      checkRef.current,
      { scale: 0, rotation: -45 },
      { scale: 1, rotation: 0, duration: 0.35, ease: "back.out(1.5)" },
      "-=0.25"
    )
    .to({}, { duration: 0.4 })
    .to(overlayRef.current, {
      opacity: 0,
      duration: 0.25,
      ease: "power2.inOut"
    });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          ref={circleRef}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-accent-success shadow-[0_0_50px_rgba(46,125,50,0.4)]"
        >
          <div ref={checkRef}>
            <Check size={48} className="text-white" strokeWidth={3} />
          </div>
        </div>
        <h2 className="font-display text-2xl font-bold text-brand-espresso">Payment Successful</h2>
      </div>
    </div>
  );
}
