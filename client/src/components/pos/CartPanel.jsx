import { Minus, Plus, Tag, X, Sparkles, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import { EmptyState } from "../common/EmptyState";
import { formatCurrency } from "../../utils/formatters";
import { usePulse } from "../../hooks/useGsapAnimation";

export function CartPanel({
  cart,
  updateQty,
  couponCode,
  onRemoveCoupon,
  onOpenDiscount,
  preview,
  previewLoading,
  onSave,
  savePending,
  editingOrderId,
  selectedTable,
}) {
  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discount = preview?.discountTotal ?? 0;
  const tax = preview?.taxTotal ?? 0;
  const total = preview?.total ?? subtotal;
  const hasDiscount = discount > 0;
  const totalRef = usePulse([total]);
  const itemCount = cart.reduce((n, i) => n + i.quantity, 0);

  return (
    <aside className="flex h-[calc(100vh-4rem)] w-full flex-col bg-bg-elevated lg:w-[420px] lg:border-l lg:border-border-subtle lg:shadow-[-4px_0_24px_rgba(59,35,20,0.04)]">
      <div className="shrink-0 border-b border-border-subtle px-6 py-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Purchase receipt</p>
            <h2 className="font-display text-xl text-brand-espresso">
              {editingOrderId ? `Order #${String(editingOrderId).slice(0, 8)}…` : "New order"}
            </h2>
          </div>
          {itemCount > 0 && <Badge variant="primary">{itemCount} items</Badge>}
        </div>
        {selectedTable && (
          <p className="mt-2 inline-flex rounded-full bg-accent-success/12 px-3 py-1 text-xs font-semibold text-accent-success">
            Table #{selectedTable.table_number}
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 cart-scroll">
        {cart.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Cart is empty"
            description="Tap a product to add it to this order."
          />
        ) : (
          <ul className="space-y-3">
            {cart.map((item) => (
              <li key={item.productId} className="flex items-center gap-3 rounded-2xl bg-bg-base p-3">
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-xl object-cover bg-bg-sunken"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-text-muted">
                    {formatCurrency(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-bg-sunken p-0.5">
                  <button
                    type="button"
                    onClick={() => updateQty(item.productId, item.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary hover:bg-bg-elevated"
                  >
                    <Minus size={14} strokeWidth={1.75} />
                  </button>
                  <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.productId, item.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-primary text-bg-elevated"
                  >
                    <Plus size={14} strokeWidth={1.75} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-border-subtle bg-bg-base px-6 py-5">
        {couponCode && (
          <div className="mb-3 flex items-center justify-between rounded-xl bg-accent-success/10 px-3 py-2">
            <span className="flex items-center gap-2 text-sm font-medium text-accent-success">
              <Sparkles size={14} /> {couponCode}
            </span>
            <button type="button" onClick={onRemoveCoupon} className="rounded p-1 text-text-muted hover:text-text-primary">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="space-y-2 rounded-xl bg-bg-elevated p-4 text-sm">
          <Row label="Subtotal" value={formatCurrency(preview?.subtotal ?? subtotal)} />
          {hasDiscount && (
            <Row label="Discount" value={`-${formatCurrency(discount)}`} highlight className={previewLoading ? "opacity-50" : ""} />
          )}
          <Row label="Tax" value={formatCurrency(tax)} />
          <div ref={totalRef} className="flex justify-between border-t border-border-subtle pt-2 text-base font-bold">
            <span className="text-brand-espresso">Total</span>
            <span className="font-display text-xl text-accent-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Button variant="secondary" className="w-full" onClick={onOpenDiscount} icon={Tag} size="sm">
            Apply discount
          </Button>
          <button
            type="button"
            disabled={!cart.length || savePending}
            onClick={onSave}
            className="pos-pill-cta flex w-full items-center justify-center gap-2 disabled:opacity-50"
          >
            {savePending ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-bg-elevated border-t-transparent" />
            ) : (
              <>
                <span>{editingOrderId ? "Update & pay" : "Proceed to payment"}</span>
                <span className="opacity-90">· {formatCurrency(total)}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value, highlight, className = "" }) {
  return (
    <div className={`flex justify-between ${highlight ? "font-medium text-accent-primary" : "text-text-secondary"} ${className}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
