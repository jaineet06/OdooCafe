import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket, WS_EVENTS } from "./useWebSocket";
import { ordersApi } from "../api/orders.api";

/** Poll + WS until order is paid */
export function useAwaitPayment(orderId, token, { onPaid, enabled }) {
  const queryClient = useQueryClient();

  useWebSocket(token, (type, payload) => {
    if (!enabled) return;
    if (type === WS_EVENTS.ORDER_PAID && payload?.orderId === orderId) {
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      onPaid?.();
    }
    if (type === WS_EVENTS.TABLE_STATUS_CHANGED) {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    }
  });

  useEffect(() => {
    if (!enabled || !orderId) return;
    let attempts = 0;
    const max = 8;
    const id = setInterval(async () => {
      attempts += 1;
      try {
        const order = await ordersApi.get(orderId);
        if (order.status === "paid") {
          clearInterval(id);
          queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
          onPaid?.();
        }
      } catch {
        /* ignore */
      }
      if (attempts >= max) clearInterval(id);
    }, 2000);
    return () => clearInterval(id);
  }, [enabled, orderId, onPaid, queryClient]);
}
