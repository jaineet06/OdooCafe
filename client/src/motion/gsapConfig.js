/** Shared GSAP timing — single source of truth for motion */
export const MOTION = {
  duration: {
    fast: 0.2,
    normal: 0.35,
    slow: 0.55,
  },
  ease: {
    out: "power3.out",
    inOut: "power2.inOut",
    bounce: "back.out(1.4)",
  },
  stagger: 0.05,
  page: { y: 16, opacity: 0 },
  modal: { scale: 0.96, opacity: 0 },
  item: { y: 12, opacity: 0 },
};
