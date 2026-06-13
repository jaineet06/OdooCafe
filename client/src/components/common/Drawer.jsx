import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { animateModalIn, animateModalOut } from "../../hooks/useGsapAnimation";

export function Drawer({ open, onClose, title, children, wide }) {
  const [mounted, setMounted] = useState(open);
  const panelRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => animateModalIn(panelRef.current, backdropRef.current));
    } else if (mounted) {
      animateModalOut(panelRef.current, backdropRef.current, () => setMounted(false));
    }
  }, [open, mounted]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        ref={backdropRef}
        type="button"
        className="absolute inset-0 bg-text-primary/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={`relative flex h-full w-full flex-col border-l border-border-subtle bg-bg-elevated shadow-none ${wide ? "max-w-2xl" : "max-w-md"}`}
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <h2 className="font-display text-xl text-brand-espresso">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-bg-sunken">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
