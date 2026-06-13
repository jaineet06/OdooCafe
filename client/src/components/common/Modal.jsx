import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { animateModalIn, animateModalOut } from "../../hooks/useGsapAnimation";

export function Modal({ open, onClose, title, children, wide, size = "md" }) {
  const [mounted, setMounted] = useState(open);
  const backdropRef = useRef(null);
  const panelRef = useRef(null);

  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-3xl" };
  const maxW = wide ? widths.lg : widths[size] || widths.md;

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => {
        animateModalIn(panelRef.current, backdropRef.current);
      });
    } else if (mounted) {
      animateModalOut(panelRef.current, backdropRef.current, () => setMounted(false));
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={panelRef}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-border-subtle bg-bg-elevated p-6 ${maxW}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="font-display text-xl text-brand-espresso">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-sunken hover:text-text-primary"
            aria-label="Close"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
