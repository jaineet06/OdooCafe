import { formatCurrency, formatDateTime } from "../../utils/formatters";

export function ReceiptDocument({ order, tenant, type = "receipt" }) {
  const isBill = type === "bill";

  return (
    <div className="flex justify-center p-4 bg-bg-sunken/30 rounded-xl border border-border-subtle/50 my-2 print:p-0 print:bg-transparent print:border-none print:my-0">
      <div className="receipt-paper relative bg-white px-5 py-6 text-black print:shadow-none print:border-none print:px-0 print:py-0 print:w-full print:max-w-full" id="receipt-document">
        <style>{`
          .receipt-paper {
            font-family: 'Courier New', Courier, monospace;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.06);
            border: 1px solid #e1dcd5;
            width: 320px;
            color: #111111;
          }
          .receipt-tear-top {
            position: absolute;
            top: -6px;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(135deg, transparent 4px, #ffffff 4px), linear-gradient(-135deg, transparent 4px, #ffffff 4px);
            background-size: 8px 8px;
          }
          .receipt-tear-bottom {
            position: absolute;
            bottom: -6px;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(45deg, transparent 4px, #ffffff 4px), linear-gradient(-45deg, transparent 4px, #ffffff 4px);
            background-size: 8px 8px;
          }
          @media print {
            body {
              background: white !important;
              color: black !important;
              font-size: 11pt !important;
            }
            /* Hide everything except receipt-document */
            body > :not(#receipt-document), 
            main > :not(#receipt-document), 
            div > :not(#receipt-document) {
              display: none !important;
            }
            #receipt-document {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            .receipt-tear-top,
            .receipt-tear-bottom {
              display: none !important;
            }
            @page {
              margin: 0;
            }
          }
        `}</style>

        {/* Tear shapes (visual only) */}
        <div className="receipt-tear-top" />
        <div className="receipt-tear-bottom" />

        {/* Header */}
        <header className="text-center pb-2">
          {tenant?.logo_url && (
            <img src={tenant.logo_url} alt="" className="mx-auto mb-2 h-10 object-contain filter grayscale" />
          )}
          <h1 className="text-base font-bold uppercase tracking-wider">{tenant?.name || "Odoo Cafe"}</h1>
          {tenant?.address && <p className="text-[11px] uppercase mt-0.5">{tenant.address}</p>}
          
          <div className="mt-3">
            <p className="text-xs font-bold uppercase tracking-widest border border-black py-0.5 px-2 inline-block">
              {isBill ? "BILL / ESTIMATE" : "TAX INVOICE"}
            </p>
          </div>
          <p className="text-xs mt-2 font-bold">ORDER #{order.order_number}</p>
          {isBill && (
            <div className="mt-1">
              <p className="text-[10px] font-bold border border-dashed border-black py-0.5 px-1 inline-block">
                PAYMENT PENDING - NOT AN INVOICE
              </p>
            </div>
          )}
        </header>

        <div className="border-t border-dashed border-black/30 my-2"></div>

        {/* Meta Info */}
        <section className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>DATE/TIME:</span>
            <span>{formatDateTime(order.created_at).toUpperCase()}</span>
          </div>
          {order.table_number && (
            <div className="flex justify-between">
              <span>TABLE:</span>
              <span className="font-bold">#{order.table_number}</span>
            </div>
          )}
          {order.employee_name && (
            <div className="flex justify-between">
              <span>SERVER:</span>
              <span>{order.employee_name.toUpperCase()}</span>
            </div>
          )}
        </section>

        {/* Customer Block */}
        {order.customer_name && (
          <>
            <div className="border-t border-dashed border-black/30 my-2"></div>
            <section className="border border-black p-2 text-xs space-y-0.5">
              <p className="font-bold uppercase text-[10px] border-b border-black/20 pb-0.5 mb-1">CUSTOMER INFO</p>
              <div className="flex justify-between">
                <span>NAME:</span>
                <span className="font-bold">{order.customer_name.toUpperCase()}</span>
              </div>
              {order.customer_phone && (
                <div className="flex justify-between">
                  <span>PHONE:</span>
                  <span>{order.customer_phone}</span>
                </div>
              )}
              {order.customer_email && (
                <div className="flex justify-between">
                  <span>EMAIL:</span>
                  <span className="break-all">{order.customer_email.toUpperCase()}</span>
                </div>
              )}
            </section>
          </>
        )}

        <div className="border-t border-dashed border-black/30 my-2"></div>

        {/* Items Table */}
        <table className="w-full text-xs my-2 border-collapse">
          <thead>
            <tr className="border-b border-black pb-1 font-bold text-left">
              <th className="pb-1 text-left">ITEM</th>
              <th className="pb-1 text-center w-8">QTY</th>
              <th className="pb-1 text-right w-16">PRICE</th>
              <th className="pb-1 text-right w-16">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, i) => (
              <tr key={item.id || i} className="border-b border-dashed border-black/10">
                <td className="py-2 pr-1 align-top">
                  <div className="font-bold uppercase">{item.product_name}</div>
                  {item.note && (
                    <div className="text-[10px] italic">
                      * {item.note.toUpperCase()}
                    </div>
                  )}
                </td>
                <td className="py-2 text-center align-top">{item.quantity}</td>
                <td className="py-2 text-right align-top">{formatCurrency(item.unit_price)}</td>
                <td className="py-2 text-right align-top font-bold">{formatCurrency(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* General Order Notes */}
        {order.note && (
          <section className="border border-dashed border-black p-2 text-xs my-2">
            <p className="font-bold uppercase text-[10px] mb-0.5 font-bold">ORDER NOTES:</p>
            <p className="italic uppercase">"{order.note}"</p>
          </section>
        )}

        {/* Discounts */}
        {order.discounts?.length > 0 && (
          <>
            <div className="border-t border-dashed border-black/30 my-2"></div>
            <section className="text-xs space-y-0.5">
              <p className="font-bold uppercase text-[10px] mb-1">DISCOUNTS APPLIED:</p>
              {order.discounts.map((d, i) => (
                <div key={d.id || i} className="flex justify-between">
                  <span>{String(d.coupon_code || d.promotion_name || d.source_type).toUpperCase()}</span>
                  <span>-{formatCurrency(d.discount_amount)}</span>
                </div>
              ))}
            </section>
          </>
        )}

        <div className="border-t border-dashed border-black/30 my-2"></div>

        {/* Totals */}
        <section className="text-xs space-y-1 pt-1">
          <div className="flex justify-between">
            <span>SUBTOTAL</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>TAX (GST)</span>
            <span>{formatCurrency(order.tax_total)}</span>
          </div>
          {order.discount_total > 0 && (
            <div className="flex justify-between">
              <span>TOTAL DISCOUNT</span>
              <span>-{formatCurrency(order.discount_total)}</span>
            </div>
          )}
          {Number(order.tip_amount) > 0 && (
            <div className="flex justify-between">
              <span>TIP</span>
              <span>{formatCurrency(order.tip_amount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-double border-black pt-1.5 text-sm font-bold">
            <span>GRAND TOTAL</span>
            <span className="text-base">{formatCurrency(order.total)}</span>
          </div>
        </section>

        {/* Payment Info */}
        {order.payment && !isBill && (
          <>
            <div className="border-t border-dashed border-black/30 my-2"></div>
            <section className="border border-black p-2 text-center text-xs space-y-1">
              <p className="font-bold uppercase">
                PAID VIA {String(order.payment.method_type).toUpperCase()}
              </p>
              {order.payment.amount_tendered != null && (
                <p>
                  TENDERED: {formatCurrency(order.payment.amount_tendered)}
                  <br />
                  CHANGE: {formatCurrency(order.payment.change_due || 0)}
                </p>
              )}
              {order.payment.upi_ref && (
                <p className="font-bold">UPI REF: {order.payment.upi_ref}</p>
              )}
            </section>
          </>
        )}

        <div className="border-t border-dashed border-black/30 my-2"></div>

        {/* Footer */}
        <footer className="text-center text-xs space-y-1">
          <p className="font-bold uppercase">
            {isBill ? "PLEASE SETTLE AT COUNTER" : "THANK YOU FOR DINING WITH US!"}
          </p>
          <p className="text-[10px] uppercase">POWERED BY ODOOCAFE</p>
        </footer>
      </div>
    </div>
  );
}
