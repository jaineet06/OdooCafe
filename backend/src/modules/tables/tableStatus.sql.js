/** Shared SQL: active order on a table within the tenant's current open session. */
export const ACTIVE_ORDER_LATERAL = `
  LEFT JOIN LATERAL (
    SELECT o.id, o.order_number, o.total
    FROM orders o
    INNER JOIN sessions s ON s.id = o.session_id
      AND s.tenant_id = o.tenant_id
      AND s.status = 'open'
    WHERE o.table_id = t.id
      AND o.tenant_id = t.tenant_id
      AND o.status NOT IN ('paid', 'cancelled')
    ORDER BY o.created_at DESC
    LIMIT 1
  ) active_order ON TRUE
`;

export const ORDER_STATUS_CASE = `
  CASE WHEN active_order.id IS NOT NULL THEN 'occupied' ELSE 'available' END
`;
