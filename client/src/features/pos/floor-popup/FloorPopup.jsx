import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { floorsApi } from "../../../api/floors.api";
import { usePos } from "../../../context/PosContext";
import { useWsEvent } from "../../../context/WebSocketContext";
import { WS_EVENTS } from "../../../utils/constants";
import { Modal } from "../../../components/common/Modal";
import { CardSkeleton } from "../../../components/common/Skeletons";
import { Button } from "../../../components/common/Button";
import { TableFloorPlan } from "../../../components/pos/TableFloorPlan";

export function FloorPopup({ open, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setSelectedTable, clearCart } = usePos();

  const { data: floors, isLoading } = useQuery({
    queryKey: ["floors"],
    queryFn: floorsApi.list,
    enabled: open,
  });

  useWsEvent((type) => {
    if (!open) return;
    if (type === WS_EVENTS.TABLE_STATUS_CHANGED || type === WS_EVENTS.ORDER_PAID) {
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    }
  });

  const { grouped, stats } = useMemo(() => {
    if (!floors) return { grouped: [], stats: { total: 0, occupied: 0, available: 0 } };
    const allTables = floors.flatMap((f) => (f.tables || []).map((t) => ({ ...t, floor_name: f.name })));
    const map = new Map();
    for (const t of allTables) {
      const floor = t.floor_name || "Main floor";
      if (!map.has(floor)) map.set(floor, []);
      map.get(floor).push(t);
    }
    const occupied = allTables.filter((t) => t.order_status === "occupied").length;
    return {
      grouped: [...map.entries()],
      stats: { total: allTables.length, occupied, available: allTables.length - occupied },
    };
  }, [floors]);

  const selectTable = (table) => {
    if (table.order_status === "occupied" && table.draft_order_id) {
      onClose();
      navigate(`/pos/orders/${table.draft_order_id}`);
      return;
    }
    clearCart();
    setSelectedTable({ ...table, floorName: table.floor_name });
    onClose();
    navigate("/pos/order");
  };

  return (
    <Modal open={open} onClose={onClose} title="Select a table" wide size="xl">
      <p className="mb-4 text-sm text-text-muted">
        Green tables are free. Occupied tables open the existing unpaid order.
      </p>
      {isLoading ? (
        <CardSkeleton count={6} />
      ) : (
        <div className="max-h-[65vh] overflow-y-auto pr-1">
          <TableFloorPlan grouped={grouped} onSelectTable={selectTable} stats={stats} />
        </div>
      )}
      <Button variant="ghost" className="mt-4 w-full" onClick={onClose}>
        Cancel
      </Button>
    </Modal>
  );
}
