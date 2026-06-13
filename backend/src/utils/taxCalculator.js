/**
 * Calculate order totals with item-level and order-level discounts.
 * @param {Array<{ unitPrice: number, quantity: number, taxRate: number, productId?: string }>} items
 * @param {Array<{ type: 'item'|'order', amount: number, productId?: string }>} discounts
 */
export function calculateOrderTotals(items, discounts = []) {
  const lineItems = items.map((item) => ({
    ...item,
    lineTotal: Number(item.unitPrice) * Number(item.quantity),
  }));

  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

  let itemDiscountTotal = 0;
  const itemDiscounts = discounts.filter((d) => d.type === "item");
  for (const discount of itemDiscounts) {
    itemDiscountTotal += Number(discount.amount);
  }

  let orderDiscountTotal = 0;
  const orderDiscounts = discounts.filter((d) => d.type === "order");
  for (const discount of orderDiscounts) {
    orderDiscountTotal += Number(discount.amount);
  }

  const discountTotal = itemDiscountTotal + orderDiscountTotal;
  const discountedSubtotal = Math.max(0, subtotal - discountTotal);

  let taxTotal = 0;
  if (subtotal > 0) {
    for (const item of lineItems) {
      const lineShare = item.lineTotal / subtotal;
      const lineDiscount = discountTotal * lineShare;
      const taxableAmount = Math.max(0, item.lineTotal - lineDiscount);
      taxTotal += (taxableAmount * Number(item.taxRate)) / 100;
    }
  }

  const total = discountedSubtotal + taxTotal;

  return {
    subtotal: round2(subtotal),
    taxTotal: round2(taxTotal),
    discountTotal: round2(discountTotal),
    total: round2(total),
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Compute discount amount from coupon/promotion definition.
 */
export function computeDiscountAmount(discountType, discountValue, baseAmount) {
  if (discountType === "percentage") {
    return round2((baseAmount * Number(discountValue)) / 100);
  }
  return round2(Math.min(Number(discountValue), baseAmount));
}
