import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { tablesApi } from "../../api/floors.api";
import { usePos } from "../../context/PosContext";
import { useWsEvent } from "../../context/WebSocketContext";
import { WS_EVENTS } from "../../utils/constants";
import { PosLayout } from "../../components/layout/PosLayout";
import { CardSkeleton } from "../../components/common/Skeletons";
import { TableFloorPlan } from "../../components/pos/TableFloorPlan";
import { Button } from "../../components/common/Button";

export default function TableViewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setSelectedTable } = usePos();

  const [isMergeMode, setIsMergeMode] = useState(false);
  const [selectedTables, setSelectedTables] = useState([]);

  const { data: tables, isLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: () => tablesApi.list(),
    refetchInterval: 30_000,
  });

  useWsEvent((type, payload) => {
    if (type === WS_EVENTS.TABLE_STATUS_CHANGED || type === WS_EVENTS.ORDER_PAID || payload?.refresh) {
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
    const occupied = tables.filter((t) => t.is_occupied).length;
    return { total: tables.length, occupied, available: tables.length - occupied };
  }, [tables]);

  const toggleTableOccupancy = useMutation({
    mutationFn: ({ id, isOccupied }) => tablesApi.setOccupancy(id, isOccupied),
    onMutate: async ({ id, isOccupied }) => {
      await queryClient.cancelQueries({ queryKey: ["tables"] });
      const previousTables = queryClient.getQueryData(["tables"]);

      queryClient.setQueryData(["tables"], (old) => {
        if (!old) return old;
        return old.map((t) =>
          t.id === id
            ? { ...t, is_occupied: isOccupied, occupied_since: isOccupied ? new Date().toISOString() : null, order_status: isOccupied ? "occupied" : "available" }
            : t
        );
      });

      return { previousTables };
    },
    onError: (err, variables, context) => {
      if (context?.previousTables) {
        queryClient.setQueryData(["tables"], context.previousTables);
      }
      toast.error(err.userMessage || "Failed to update table occupancy");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Table occupancy updated");
    },
  });

  const mergeMutation = useMutation({
    mutationFn: () => {
      const primary = selectedTables[0];
      const secondaryIds = selectedTables.slice(1).map((t) => t.id);
      return tablesApi.merge(primary.id, secondaryIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      setSelectedTables([]);
      setIsMergeMode(false);
      toast.success("Tables merged successfully");
    },
    onError: (err) => toast.error(err.userMessage || "Failed to merge tables"),
  });

  const unmergeMutation = useMutation({
    mutationFn: (tableId) => tablesApi.unmerge(tableId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Group unmerged successfully");
    },
    onError: (err) => toast.error(err.userMessage || "Failed to unmerge group"),
  });

  const handleTableClick = (table) => {
    if (!table.is_active) return;

    if (isMergeMode) {
      if (selectedTables.find((t) => t.id === table.id)) {
        setSelectedTables(selectedTables.filter((t) => t.id !== table.id));
      } else {
        setSelectedTables([...selectedTables, table]);
      }
      return;
    }

    const actualTableId = table.merge_primary_id || table.id;
    const actualTable = tables.find((t) => t.id === actualTableId) || table;

    // If this table has an active draft order, show that order instead of creating a new one
    if (actualTable.draft_order_id) {
      navigate(`/pos/orders/${actualTable.draft_order_id}`);
      return;
    }

    setSelectedTable({
      id: actualTable.id,
      table_number: actualTable.table_number,
      floorName: actualTable.floor_name,
    });
    navigate("/pos/order");
  };

  const handleToggleOccupancy = (table) => {
    const targetId = table.merge_primary_id || table.id;
    const targetTable = tables.find((t) => t.id === targetId) || table;
    toggleTableOccupancy.mutate({
      id: targetId,
      isOccupied: !targetTable.is_occupied,
    });
  };

  const handleUnmerge = (table) => {
    unmergeMutation.mutate(table.id);
  };

  return (
    <PosLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-brand-espresso">Floor plan</h1>
            <p className="mt-1 text-sm text-text-muted">Tap a table to seat guests or view open orders</p>
          </div>
          
          <div className="flex gap-2">
            {isMergeMode ? (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => mergeMutation.mutate()}
                  disabled={selectedTables.length < 2 || mergeMutation.isPending}
                >
                  Confirm Merge ({selectedTables.length})
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setIsMergeMode(false);
                    setSelectedTables([]);
                  }}
                >
                  Cancel Selection
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsMergeMode(true)}
              >
                Merge Tables
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <CardSkeleton count={12} />
        ) : (
          <TableFloorPlan
            grouped={grouped}
            onSelectTable={handleTableClick}
            stats={stats}
            isMergeMode={isMergeMode}
            selectedTableIds={selectedTables.map((t) => t.id)}
            onToggleOccupancy={handleToggleOccupancy}
            onUnmerge={handleUnmerge}
          />
        )}
      </div>
    </PosLayout>
  );
}
