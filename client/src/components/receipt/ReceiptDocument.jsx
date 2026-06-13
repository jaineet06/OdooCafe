import { formatCurrency, formatDateTime } from "../../utils/formatters";

export function ReceiptDocument({ order, tenant, type = "receipt" }) {
  const isBill = type === "bill";

  return (
    <div className="mx-auto max-w-lg bg-white p-8 font-body text-text-primary print:p-4" id="receipt-document">
      <header className="border-b border-border-subtle pb-4 text-center">
        {tenant?.logo_url && (
          <img src={tenant.logo_url} alt="" className="mx-auto mb-3 h-14 object-contain" />
        )}
        <h1 className="font-display text-2xl text-brand-espresso">{tenant?.name || "Odoo Cafe"}</h1>
        {tenant?.address && <p className="mt-1 text-xs text-text-muted">{tenant.address}</p>}
        <p className="mt-3 text-sm font-bold uppercase tracking-wider text-accent-primary">
          {isBill ? "Bill" : "Receipt"}
        </p>
        {isBill && (
          <p className="mt-1 text-xs font-semibold text-accent-danger">Payment pending — not a tax invoice</p>
        )}
      </header>

      <section className="border-b border-border-subtle py-4 text-sm">
        <div className="grid grid-cols-2 gap-1 text-text-secondary">
          <span>Order #</span><span className="text-right font-medium">{order.order_number}</span>
          <span>Date</span><span className="text-right">{formatDateTime(order.created_at)}</span>
          {order.table_number && <><span>Table</span><span className="text-right">#{order.table_number}</span></>}
          {order.employee_name && <><span>Served by</span><span className="text-right">{order.employee_name}</span></>}
          {order.customer_name && <><span>Customer</span><span className="text-right">{order.customer_name}</span></>}
        </div>
      </section>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle text-left text-xs uppercase text-text-muted">
            <th className="pb-2 font-semibold">Item</th>
            <th className="pb-2 text-center font-semibold">Qty</th>
            <th className="pb-2 text-right font-semibold">Price</th>
            <th className="pb-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, i) => (
            <tr key={item.id || i} className={i % 2 ? "bg-bg-base/50" : ""}>
              <td className="py-2 pr-2">{item.product_name}</td>
              <td className="py-2 text-center">{item.quantity}</td>
              <td className="py-2 text-right">{formatCurrency(item.unit_price)}</td>
              <td className="py-2 text-right font-medium">{formatCurrency(item.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {order.discounts?.length > 0 && (
        <div className="mt-4 space-y-1 text-sm">
          <p className="text-xs font-semibold uppercase text-text-muted">Discounts</p>
          {order.discounts.map((d) => (
            <div key={d.id} className="flex justify-between text-accent-success">
              <span>{d.coupon_code || d.promotion_name || d.source_type}</span>
              <span>-{formatCurrency(d.discount_amount)}</span>
            </div>
          ))}
        </div>
      )}

      <section className="mt-4 space-y-1 border-t-2 border-brand-espresso pt-4 text-sm">
        <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
        <Row label="Tax" value={formatCurrency(order.tax_total)} />
        {order.discount_total > 0 && <Row label="Discount" value={`-${formatCurrency(order.discount_total)}`} />}
        <div className="flex justify-between pt-2 text-lg font-bold">
          <span>Total</span>
          <span className="text-accent-primary">{formatCurrency(order.total)}</span>
        </div>
      </section>

      {order.payment && !isBill && (
        <section className="mt-4 rounded-lg bg-bg-base p-3 text-center text-sm">
          <p className="font-semibold uppercase">{order.payment.method_type} payment</p>
          {order.payment.amount_tendered != null && (
            <p>Tendered {formatCurrency(order.payment.amount_tendered)} · Change {formatCurrency(order.payment.change_due || 0)}</p>
          )}
          {order.payment.upi_ref && <p>Ref: {order.payment.upi_ref}</p>}
        </section>
      )}

      <footer className="mt-8 text-center text-xs text-text-muted">
        {isBill ? "Please settle at the counter. Thank you!" : "Thank you for dining with us!"}
      </footer>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-text-secondary">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
