import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { MOTION } from "../motion/gsapConfig";
import { motionSafe, prefersReducedMotion } from "../motion/prefersReducedMotion";

/** Fade+slide page content on mount */
export function usePageEnter(deps = []) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: MOTION.page.opacity, y: MOTION.page.y },
      motionSafe({ opacity: 1, y: 0, duration: MOTION.duration.normal, ease: MOTION.ease.out })
    );
  }, deps);

  return ref;
}

/** Stagger children matching selector */
export function useStagger(selector, deps = []) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = root.querySelectorAll(selector);
    if (!items.length) return;
    gsap.fromTo(
      items,
      { opacity: MOTION.item.opacity, y: MOTION.item.y },
      motionSafe({
        opacity: 1,
        y: 0,
        duration: MOTION.duration.normal,
        stagger: MOTION.stagger,
        ease: MOTION.ease.out,
      })
    );
  }, deps);

  return ref;
}

/** Animate modal panel — call on open */
export function animateModalIn(panelEl, backdropEl) {
  if (!panelEl) return;
  if (prefersReducedMotion()) return;
  gsap.fromTo(backdropEl, { opacity: 0 }, { opacity: 1, duration: MOTION.duration.fast });
  gsap.fromTo(
    panelEl,
    { opacity: MOTION.modal.opacity, scale: MOTION.modal.scale },
    { opacity: 1, scale: 1, duration: MOTION.duration.normal, ease: MOTION.ease.out }
  );
}

export function animateModalOut(panelEl, backdropEl, onComplete) {
  if (prefersReducedMotion()) {
    onComplete?.();
    return;
  }
  gsap.to(backdropEl, { opacity: 0, duration: MOTION.duration.fast });
  gsap.to(panelEl, {
    opacity: 0,
    scale: MOTION.modal.scale,
    duration: MOTION.duration.fast,
    ease: MOTION.ease.inOut,
    onComplete,
  });
}

/** Sidebar width animation */
export function animateSidebar(el, collapsed) {
  if (!el || prefersReducedMotion()) return;
  gsap.to(el, {
    width: collapsed ? 68 : 224,
    duration: MOTION.duration.fast,
    ease: MOTION.ease.inOut,
  });
}

/** Pulse element on value change */
export function usePulse(deps = []) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    gsap.fromTo(el, { scale: 1 }, { scale: 1.06, duration: 0.12, yoyo: true, repeat: 1, ease: MOTION.ease.out });
  }, deps);

  return ref;
}

/** Count-up a numeric display */
export function useCountUp(value, duration = 0.8) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || value == null) return;
    const obj = { val: 0 };
    if (prefersReducedMotion()) {
      el.textContent = String(value);
      return;
    }
    gsap.to(obj, {
      val: value,
      duration,
      ease: MOTION.ease.out,
      onUpdate: () => {
        el.textContent = Math.round(obj.val).toLocaleString();
      },
    });
  }, [value, duration]);

  return ref;
}

/** Crossfade skeleton → content */
export function useContentReveal(ready, deps = []) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ready) return;
    const el = ref.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0 },
      motionSafe({ opacity: 1, duration: MOTION.duration.normal, ease: MOTION.ease.out })
    );
  }, [ready, ...deps]);

  return ref;
}

// Legacy aliases
export const useGsapEntrance = usePageEnter;
export const useGsapStagger = useStagger;
