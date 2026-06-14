import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Tag, X, Sparkles, ShoppingCart, ArrowRight, Users, UserPlus, UserCheck, MessageSquare, PlusCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import { EmptyState } from "../common/EmptyState";
import { formatCurrency } from "../../utils/formatters";
import { usePos } from "../../context/PosContext";
import { customersApi } from "../../api/customers.api";
import { ProductImage } from "./ProductImage";

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
  const queryClient = useQueryClient();
  const {
    customerId,
    setCustomerId,
    note,
    setNote,
    tipAmount,
    setTipAmount,
    setCart
  } = usePos();

  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  
  // Inline Customer Form State
  const [showCustForm, setShowCustForm] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");

  // Expandable notes state (productId -> boolean)
  const [openNotes, setOpenNotes] = useState({});

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discount = preview?.discountTotal ?? 0;
  const tax = preview?.taxTotal ?? 0;
  const total = preview?.total ?? (subtotal - discount + tax + Number(tipAmount));
  const hasDiscount = discount > 0;
  const itemCount = cart.reduce((n, i) => n + i.quantity, 0);

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ["customers", customerSearch],
    queryFn: () => customersApi.list({ search: customerSearch || undefined }),
  });

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Create new customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: () =>
      customersApi.create({
        name: newCustName,
        phone: newCustPhone,
        email: newCustEmail || null,
      }),
    onSuccess: (newCust) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setCustomerId(newCust.id);
      setShowCustForm(false);
      setNewCustName("");
      setNewCustPhone("");
      setNewCustEmail("");
      setCustomerSearch("");
      toast.success("Customer created and linked");
    },
    onError: (err) => toast.error(err.userMessage || "Failed to create customer"),
  });

  const handleItemNoteChange = (productId, val) => {
    setCart((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, note: val } : i))
    );
  };

  const handleTipPercent = (percent) => {
    const calculated = Math.round(subtotal * percent) / 100;
    setTipAmount(calculated);
  };

  return (
    <aside className="flex h-[calc(100vh-4rem)] w-full flex-col bg-bg-elevated lg:w-[420px] lg:border-l lg:border-border-subtle lg:shadow-[-4px_0_24px_rgba(59,35,20,0.04)]">
      {/* Header */}
      <div className="shrink-0 border-b border-border-subtle px-6 py-4">
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

      {/* Customer block & General Note (Inline at top of Cart Panel) */}
      <div className="shrink-0 border-b border-border-subtle bg-bg-base/30 px-6 py-4 space-y-3">
        {/* Customer Lookup */}
        <div className="relative">
          {selectedCustomer ? (
            <div className="flex items-center justify-between rounded-xl border border-accent-success bg-accent-success/5 p-3">
              <div className="flex items-center gap-2">
                <UserCheck className="text-accent-success" size={18} />
                <div>
                  <p className="text-sm font-semibold text-brand-espresso">{selectedCustomer.name}</p>
                  <p className="text-xs text-text-muted">{selectedCustomer.phone}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCustomerId(null);
                  setCustomerSearch("");
                }}
                className="rounded-full p-1 text-text-muted hover:bg-bg-sunken hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>
          ) : showCustForm ? (
            <div className="rounded-xl border border-border-subtle bg-bg-elevated p-3 space-y-3">
              <div className="flex items-center justify-between border-b border-border-subtle pb-1">
                <span className="text-xs font-bold uppercase text-text-muted flex items-center gap-1">
                  <UserPlus size={14} /> New Customer
                </span>
                <button type="button" onClick={() => setShowCustForm(false)} className="text-text-muted hover:text-text-primary">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-border-subtle bg-bg-base focus:outline-none focus:border-accent-primary"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-border-subtle bg-bg-base focus:outline-none focus:border-accent-primary"
                />
                <input
                  type="email"
                  placeholder="Email (Optional)"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-border-subtle bg-bg-base focus:outline-none focus:border-accent-primary"
                />
              </div>
              <button
                type="button"
                onClick={() => createCustomerMutation.mutate()}
                disabled={!newCustName || !newCustPhone || createCustomerMutation.isPending}
                className="w-full py-1.5 text-xs font-bold bg-accent-primary text-white rounded hover:bg-accent-primary-hover disabled:opacity-50"
              >
                Save & Link Customer
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 border border-border-subtle bg-bg-elevated rounded-xl px-3 py-2">
                <Users className="text-text-muted shrink-0" size={16} />
                <input
                  type="text"
                  placeholder="Search or add customer..."
                  value={customerSearch}
                  onFocus={() => setShowCustDropdown(true)}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustDropdown(true);
                  }}
                  className="w-full text-xs focus:outline-none"
                />
                {customerSearch && (
                  <button type="button" onClick={() => setCustomerSearch("")} className="text-text-muted">
                    <X size={14} />
                  </button>
                )}
              </div>

              {showCustDropdown && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-bg-elevated border border-border-subtle rounded-xl shadow-lg divide-y divide-border-subtle">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCustomerId(c.id);
                        setShowCustDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-bg-base flex justify-between items-center cursor-pointer"
                    >
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-text-muted">{c.phone}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setNewCustName(customerSearch);
                      setShowCustForm(true);
                      setShowCustDropdown(false);
                    }}
                    className="w-full px-3 py-2.5 text-left text-xs text-accent-primary font-bold hover:bg-bg-base flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle size={14} /> Add new customer "{customerSearch || "..."}"
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* General Order Note */}
        <div className="flex items-start gap-2 border border-border-subtle bg-bg-elevated rounded-xl px-3 py-2">
          <MessageSquare className="text-text-muted shrink-0 mt-1" size={16} />
          <textarea
            rows="1"
            placeholder="Order note (e.g. birthday — bring candle)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full text-xs focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Cart Items List */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 cart-scroll">
        {cart.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Cart is empty"
            description="Tap a product to add it to this order."
          />
        ) : (
          <ul className="space-y-4">
            {cart.map((item) => (
              <li key={item.productId} className="flex flex-col gap-2 rounded-2xl bg-bg-base p-3">
                <div className="flex items-center gap-3">
                  <ProductImage
                    src={item.imageUrl}
                    name={item.name}
                    color={item.categoryColor}
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
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
                </div>

                {/* Per-Item Notes Section */}
                <div className="border-t border-border-subtle/50 pt-2 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setOpenNotes(prev => ({ ...prev, [item.productId]: !prev[item.productId] }))}
                    className="text-[10px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1 hover:text-brand-espresso"
                  >
                    <MessageSquare size={10} /> {item.note ? "Edit Instruction" : "Add Kitchen Instruction"}
                  </button>
                  
                  {(openNotes[item.productId] || item.note) && (
                    <input
                      type="text"
                      placeholder="e.g. no ice, extra spicy"
                      value={item.note || ""}
                      onChange={(e) => handleItemNoteChange(item.productId, e.target.value)}
                      className="w-full text-xs p-1.5 rounded border border-border-subtle bg-bg-elevated focus:outline-none text-text-primary"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tip Section & Footer */}
      <div className="shrink-0 border-t border-border-subtle bg-bg-base px-6 py-4">
        {/* Tip section (Wheel/Slider/Selector) */}
        {cart.length > 0 && (
          <div className="mb-4 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">Add a Tip</span>
            <div className="flex items-center gap-1.5">
              {[0, 5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleTipPercent(pct)}
                  className={`flex-1 py-1 rounded text-xs font-semibold border transition-colors cursor-pointer ${
                    Math.abs(Number(tipAmount) - (subtotal * pct / 100)) < 0.01
                      ? "bg-brand-espresso text-white border-brand-espresso"
                      : "bg-bg-elevated text-text-secondary border-border-subtle hover:border-text-muted"
                  }`}
                >
                  {pct}%
                </button>
              ))}
              <div className="flex items-center bg-bg-elevated border border-border-subtle rounded px-2 w-[85px] h-7 shrink-0">
                <span className="text-xs text-text-muted mr-1">$</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Custom"
                  value={tipAmount || ""}
                  onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

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

        {/* Totals Box */}
        <div className="space-y-2 rounded-xl bg-bg-elevated p-4 text-sm">
          <Row label="Subtotal" value={formatCurrency(preview?.subtotal ?? subtotal)} />
          {hasDiscount && (
            <Row label="Discount" value={`-${formatCurrency(discount)}`} highlight className={previewLoading ? "opacity-50" : ""} />
          )}
          <Row label="Tax" value={formatCurrency(tax)} />
          {Number(tipAmount) > 0 && (
            <Row label="Tip" value={formatCurrency(tipAmount)} className={previewLoading ? "opacity-50" : ""} />
          )}
          <div className="flex justify-between border-t border-border-subtle pt-2 text-base font-bold">
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
            className="pos-pill-cta flex w-full items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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

