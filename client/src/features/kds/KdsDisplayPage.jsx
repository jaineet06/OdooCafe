import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { kdsApi } from "../../api/config.api";
import { useWsEvent } from "../../context/WebSocketContext";
import { WS_EVENTS } from "../../utils/constants";
import { useDebounce } from "../../hooks/useDebounce";
import { KdsLayout } from "../../components/layout/KdsLayout";
import { SearchInput } from "../../components/common/SearchInput";
import { StatusPill } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { CardSkeleton } from "../../components/common/Skeletons";
import { KDS_STAGE_COLORS } from "../../styles/tokens";

const STAGES = ["to_cook", "preparing", "completed"];
const stageLabels = { to_cook: "To cook", preparing: "Preparing", completed: "Done" };

function KdsItem({ item, onComplete, kdsOrderId, completingId }) {
  return (
    <li className={`flex flex-col gap-1 text-lg ${item.isCompleted ? "opacity-55 line-through" : ""}`}>
      <div className="flex items-center justify-between">
        <span>{item.quantity}× {item.productName}</span>
        {!item.isCompleted && (
          <Button
            size="sm"
            variant="secondary"
            className="!bg-kds-surface !text-kds-text shrink-0"
            loading={completingId === item.kdsItemId}
            onClick={() => onComplete({ kdsOrderId, itemId: item.kdsItemId })}
          >
            Done
          </Button>
        )}
      </div>
      {item.note && (
        <span className="text-sm font-semibold text-accent-primary bg-accent-primary/5 rounded px-2 py-0.5 self-start">
          Note: {item.note}
        </span>
      )}
    </li>
  );
}

function patchTicket(tickets, kdsOrderId, patch) {
  return tickets?.map((t) => (t.kds_order_id === kdsOrderId ? { ...t, ...patch } : t)) || [];
}

export default function KdsDisplayPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [advancingId, setAdvancingId] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const debouncedSearch = useDebounce(search);

  // Filter and Sort states
  const [stageFilter, setStageFilter] = useState("all");
  const [sortBy, setSortBy] = useState("longest_wait");
  const [tick, setTick] = useState(0);

  // Live timer tick every 30 seconds
  useState(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["kds-orders"],
    queryFn: kdsApi.list,
    refetchInterval: 30_000,
  });

  useWsEvent((type, payload) => {
    if (type === WS_EVENTS.ORDER_SENT_TO_KDS) {
      queryClient.invalidateQueries({ queryKey: ["kds-orders"] });
      return;
    }
    if (type === WS_EVENTS.KDS_STAGE_UPDATED && payload?.kdsOrderId) {
      queryClient.setQueryData(["kds-orders"], (old) =>
        patchTicket(old, payload.kdsOrderId, { stage: payload.newStage })
      );
    }
    if (type === WS_EVENTS.KDS_ITEM_COMPLETED && payload?.kdsOrderId) {
      queryClient.setQueryData(["kds-orders"], (old) =>
        old?.map((t) => {
          if (t.kds_order_id !== payload.kdsOrderId) return t;
          return {
            ...t,
            items: t.items?.map((item) =>
              item.orderItemId === payload.orderItemId ? { ...item, isCompleted: true } : item
            ),
          };
        })
      );
    }
  });

  const advanceStage = useMutation({
    mutationFn: ({ id, stage }) => kdsApi.updateStage(id, stage),
    onMutate: ({ id }) => setAdvancingId(id),
    onSuccess: (_data, { id, stage }) => {
      queryClient.setQueryData(["kds-orders"], (old) => patchTicket(old, id, { stage }));
      toast.success("Stage updated");
    },
    onError: (err) => toast.error(err.userMessage),
    onSettled: () => setAdvancingId(null),
  });

  const completeItem = useMutation({
    mutationFn: ({ kdsOrderId, itemId }) => kdsApi.completeItem(kdsOrderId, itemId),
    onMutate: ({ itemId }) => setCompletingId(itemId),
    onSuccess: (_data, { kdsOrderId, itemId }) => {
      queryClient.setQueryData(["kds-orders"], (old) =>
        old?.map((t) => {
          if (t.kds_order_id !== kdsOrderId) return t;
          return {
            ...t,
            items: t.items?.map((item) =>
              item.kdsItemId === itemId ? { ...item, isCompleted: true } : item
            ),
          };
        })
      );
    },
    onError: (err) => toast.error(err.userMessage),
    onSettled: () => setCompletingId(null),
  });

  const filteredAndSorted = useMemo(() => {
    if (!tickets) return [];

    const list = tickets.filter((t) => {
      // 1. Hide completed tickets
      if (t.stage === "completed") return false;

      // 2. Only show recent orders (sent within the last 24 hours)
      const sentTime = new Date(t.sent_at).getTime();
      const isRecent = (Date.now() - sentTime) < 24 * 60 * 60 * 1000;
      if (!isRecent) return false;

      // 3. Stage filter
      if (stageFilter !== "all" && t.stage !== stageFilter) return false;

      // 4. Search query
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const matchesSearch = String(t.order_number).includes(q) || t.table_number?.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      return true;
    });

    // Sort tickets
    return [...list].sort((a, b) => {
      if (sortBy === "longest_wait") {
        return new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime();
      }
      if (sortBy === "shortest_wait") {
        return new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime();
      }
      if (sortBy === "order_number") {
        return Number(a.order_number) - Number(b.order_number);
      }
      return 0;
    });
  }, [tickets, stageFilter, debouncedSearch, sortBy, tick]);

  const nextStage = (current) => STAGES[Math.min(STAGES.indexOf(current) + 1, STAGES.length - 1)];

  return (
    <KdsLayout>
      <div className="p-6">
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-kds-surface p-4 rounded-xl border border-kds-border">
          <h2 className="font-display text-xl text-kds-text">Active Tickets ({filteredAndSorted.length})</h2>
          
          <div className="flex flex-wrap gap-3 items-center">
            {/* Stage filter */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="rounded-lg border border-kds-border bg-kds-surface px-3 py-1.5 text-sm text-kds-text focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="all">All Stages</option>
              <option value="to_cook">To Cook</option>
              <option value="preparing">Preparing</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-kds-border bg-kds-surface px-3 py-1.5 text-sm text-kds-text focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="longest_wait">Longest Wait (Oldest)</option>
              <option value="shortest_wait">Shortest Wait (Newest)</option>
              <option value="order_number">Order Number</option>
            </select>

            {/* Search Input */}
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order / table…"
              className="max-w-xs [&_input]:!border-kds-border [&_input]:!bg-kds-surface [&_input]:!text-kds-text"
            />
          </div>
        </div>

        {isLoading ? (
          <CardSkeleton count={4} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAndSorted.map((ticket) => {
              const waitTimeMins = Math.floor((Date.now() - new Date(ticket.sent_at).getTime()) / 60000);
              const waitLabel = waitTimeMins < 1 ? "Just now" : `${waitTimeMins}m ago`;
              const waitBadgeColor = 
                waitTimeMins < 10 
                  ? "text-accent-success border-accent-success/30 bg-accent-success/10" 
                  : waitTimeMins < 20 
                  ? "text-accent-warning border-accent-warning/30 bg-accent-warning/10" 
                  : "text-accent-danger border-accent-danger/30 bg-accent-danger/10 animate-pulse";

              return (
                <div
                  key={ticket.kds_order_id}
                  className="rounded-xl border-2 bg-kds-surface p-6"
                  style={{ borderColor: KDS_STAGE_COLORS[ticket.stage] }}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="font-display text-3xl">#{ticket.order_number}</p>
                      {ticket.table_number && <p className="text-sm text-kds-muted">Table {ticket.table_number}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusPill status={ticket.stage} label={stageLabels[ticket.stage]} />
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${waitBadgeColor}`}>
                        WAIT: {waitLabel.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {ticket.order_note && (
                    <div className="mb-4 rounded-lg bg-accent-primary/10 p-3 text-sm border border-accent-primary/20">
                      <p className="font-bold text-accent-primary uppercase text-[10px] tracking-wider mb-0.5">Order Note</p>
                      <p className="text-text-primary font-medium">{ticket.order_note}</p>
                    </div>
                  )}

                  <ul className="mb-6 space-y-3">
                    {(ticket.items || []).map((item) => (
                      <KdsItem
                        key={item.kdsItemId}
                        item={item}
                        kdsOrderId={ticket.kds_order_id}
                        completingId={completingId}
                        onComplete={completeItem.mutate}
                      />
                    ))}
                  </ul>

                  {ticket.stage !== "completed" && (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() =>
                        advanceStage.mutate({ id: ticket.kds_order_id, stage: nextStage(ticket.stage) })
                      }
                      loading={advancingId === ticket.kds_order_id}
                      style={{ backgroundColor: KDS_STAGE_COLORS[nextStage(ticket.stage)] }}
                    >
                      Move to {stageLabels[nextStage(ticket.stage)]}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </KdsLayout>
  );
}
