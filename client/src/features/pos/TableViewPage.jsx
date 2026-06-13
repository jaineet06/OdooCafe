import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { tablesApi } from "../../api/floors.api";
import { usePos } from "../../context/PosContext";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket, WS_EVENTS } from "../../hooks/useWebSocket";
import { useGsapEntrance } from "../../hooks/useGsapAnimation";
import { PosLayout } from "../../components/layout/PosLayout";
import { CardSkeleton } from "../../components/common/Skeletons";
import { TableFloorPlan } from "../../components/pos/TableFloorPlan";

export default function TableViewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { setSelectedTable } = usePos();
  const pageRef = useGsapEntrance([]);

  const { data: tables, isLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: () => tablesApi.list(),
    refetchInterval: 30_000,
  });

  useWebSocket(token, (type) => {
    if (type === WS_EVENTS.TABLE_STATUS_CHANGED || type === WS_EVENTS.ORDER_PAID) {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    }
  });

  const grouped = useMemo(() => {
    if (!tables) return [];
    const map = new Map();
    for (const t of tables) {
      const floor = t.floor_name || "Main floor";
      if (!map.has(floor)) map.set(floor, []);
      map.get(floor).push(t);
    }
    return [...map.entries()];
  }, [tables]);

  const stats = useMemo(() => {
    if (!tables) return { total: 0, occupied: 0, available: 0 };
    const occupied = tables.filter((t) => t.order_status === "occupied").length;
    return { total: tables.length, occupied, available: tables.length - occupied };
  }, [tables]);

  const handleTable = (table) => {
    if (!table.is_active) return;
    if (table.order_status === "occupied" && table.draft_order_id) {
      navigate(`/pos/orders/${table.draft_order_id}`);
      return;
    }
    setSelectedTable({ id: table.id, table_number: table.table_number, floorName: table.floor_name });
    navigate("/pos/order");
  };

  return (
    <PosLayout>
      <div ref={pageRef} className="p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-brand-espresso">Floor plan</h1>
          <p className="mt-1 text-sm text-text-muted">Tap a table to seat guests or view open orders</p>
        </div>

        {isLoading ? (
          <CardSkeleton count={12} />
        ) : (
          <TableFloorPlan tables={tables} grouped={grouped} onSelectTable={handleTable} stats={stats} />
        )}
      </div>
    </PosLayout>
  );
}
