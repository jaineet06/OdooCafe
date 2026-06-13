export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function motionSafe(gsapVars, reducedVars = { duration: 0 }) {
  return prefersReducedMotion() ? reducedVars : gsapVars;
}
