import { useQueryClient } from "@tanstack/react-query";
import { useWsEvent } from "../context/WebSocketContext";
import { WS_EVENTS } from "../utils/constants";

/** Keep POS order lists/details in sync with KDS + table + payment events. */
export function usePosOrderSync() {
  const queryClient = useQueryClient();

  useWsEvent((type, payload) => {
    if (type === WS_EVENTS.KDS_STAGE_UPDATED && payload?.orderId) {
      queryClient.setQueryData(["orders", payload.orderId], (old) =>
        old ? { ...old, kds_stage: payload.newStage } : old
      );
      queryClient.setQueriesData({ queryKey: ["orders"] }, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((o) =>
            o.id === payload.orderId ? { ...o, kds_stage: payload.newStage } : o
          ),
        };
      });
    }
    if (type === WS_EVENTS.TABLE_STATUS_CHANGED || type === WS_EVENTS.ORDER_PAID) {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["floors"] });
    }
    if (type === WS_EVENTS.ORDER_PAID && payload?.orderId) {
      queryClient.invalidateQueries({ queryKey: ["orders", payload.orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  });
}

export function PosOrderSync() {
  usePosOrderSync();
  return null;
}
