import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { kdsApi } from "../../api/config.api";
import { useWsEvent } from "../../context/WebSocketContext";
import { WS_EVENTS } from "../../utils/constants";
import { useDebounce } from "../../hooks/useDebounce";
import { PosLayout } from "../../components/layout/PosLayout";
import { SearchInput } from "../../components/common/SearchInput";
import { StatusPill } from "../../components/common/Badge";
import { CardSkeleton } from "../../components/common/Skeletons";
import { KDS_STAGE_COLORS } from "../../styles/tokens";
import { useCategories } from "../../context/CategoryContext";
import { Select } from "../../components/common/Select";

const stageLabels = { to_cook: "To cook", preparing: "Preparing", completed: "Done" };

function KitchenStatusItem({ item }) {
  return (
    <li className={`flex flex-col gap-1 text-base py-1.5 ${item.isCompleted ? "opacity-55 line-through" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="font-medium">{item.quantity}× {item.productName}</span>
        {item.isCompleted && (
          <span className="text-[10px] uppercase font-bold text-accent-success bg-accent-success/12 px-2 py-0.5 rounded">
            Done
          </span>
        )}
      </div>
      {item.note && (
        <span className="text-xs font-semibold text-accent-primary bg-accent-primary/5 rounded px-2 py-0.5 self-start">
          Note: {item.note}
        </span>
      )}
    </li>
  );
}

export default function KitchenStatusPage() {
  const queryClient = useQueryClient();
  const { categories } = useCategories();
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [sortBy, setSortBy] = useState("longest_wait");
  const [tick, setTick] = useState(0);

  const debouncedSearch = useDebounce(search);
  const debouncedProductSearch = useDebounce(productSearch);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["kds-orders"],
    queryFn: kdsApi.list,
    refetchInterval: 15_000,
  });

  useWsEvent((type, payload) => {
    if (type === WS_EVENTS.ORDER_SENT_TO_KDS) {
      queryClient.invalidateQueries({ queryKey: ["kds-orders"] });
      return;
    }
    if (type === WS_EVENTS.KDS_STAGE_UPDATED && payload?.kdsOrderId) {
      queryClient.invalidateQueries({ queryKey: ["kds-orders"] });
    }
    if (type === WS_EVENTS.KDS_ITEM_COMPLETED && payload?.kdsOrderId) {
      queryClient.invalidateQueries({ queryKey: ["kds-orders"] });
    }
  });

  const filteredAndSorted = useMemo(() => {
    if (!tickets) return [];

    let list = tickets.map((ticket) => {
      const matchingItems = (ticket.items || []).filter((item) => {
        if (categoryFilter !== "all" && item.categoryId !== categoryFilter) return false;
        if (debouncedProductSearch && !item.productName.toLowerCase().includes(debouncedProductSearch.toLowerCase())) {
          return false;
        }
        return true;
      });
      return { ...ticket, items: matchingItems };
    }).filter((ticket) => {
      // 1. Only show recent orders (sent within the last 24 hours)
      const sentTime = new Date(ticket.sent_at).getTime();
      const isRecent = (Date.now() - sentTime) < 24 * 60 * 60 * 1000;
      if (!isRecent) return false;

      // 3. Stage filter
      if (stageFilter !== "all" && ticket.stage !== stageFilter) return false;

      // 4. Ticket item check
      if (ticket.items.length === 0) return false;

      // 5. Search query
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const matchesSearch = String(ticket.order_number).includes(q) || ticket.table_number?.toLowerCase().includes(q);
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
  }, [tickets, categoryFilter, debouncedProductSearch, stageFilter, debouncedSearch, sortBy, tick]);

  return (
    <PosLayout>
      <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl text-brand-espresso">Kitchen Order Status</h1>
            <p className="text-sm text-text-muted">Live read-only monitor of active kitchen tickets</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Order / Table..."
              className="max-w-xs"
            />
            <SearchInput
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search Product..."
              className="max-w-xs"
            />
          </div>
        </header>

        {/* Filters and Sorting Toolbar */}
        <div className="flex flex-wrap gap-3 items-center justify-between bg-bg-elevated p-4 rounded-xl border border-border-subtle/60">
          <p className="text-sm text-text-secondary font-medium">
            Active Tickets: <strong className="text-brand-espresso">{filteredAndSorted.length}</strong>
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            {/* Category Filter */}
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="!w-auto min-w-[130px]">
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>

            {/* Stage Filter */}
            <Select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="!w-auto min-w-[130px]">
              <option value="all">All Stages</option>
              <option value="to_cook">To Cook</option>
              <option value="preparing">Preparing</option>
            </Select>

            {/* Sort Select */}
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="!w-auto min-w-[150px]">
              <option value="longest_wait">Longest Wait</option>
              <option value="shortest_wait">Shortest Wait</option>
              <option value="order_number">Order Number</option>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <CardSkeleton count={4} />
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-20 text-text-muted bg-bg-elevated rounded-2xl border border-border-subtle">
            No active kitchen tickets found
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSorted.map((ticket) => {
              const waitTimeMins = Math.floor((Date.now() - new Date(ticket.sent_at).getTime()) / 60000);
              const waitLabel = waitTimeMins < 1 ? "Just now" : `${waitTimeMins}m ago`;
              const waitBadgeColor = 
                waitTimeMins < 10 
                  ? "text-accent-success border-accent-success/20 bg-accent-success/5" 
                  : waitTimeMins < 20 
                  ? "text-accent-warning border-accent-warning/20 bg-accent-warning/5" 
                  : "text-accent-danger border-accent-danger/20 bg-accent-danger/5 animate-pulse";

              return (
                <div
                  key={ticket.kds_order_id}
                  className="flex flex-col rounded-xl border-2 bg-bg-elevated p-5 shadow-sm transition-all hover:shadow-md"
                  style={{ borderColor: KDS_STAGE_COLORS[ticket.stage] }}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <span className="font-display text-2xl text-brand-espresso">#{ticket.order_number}</span>
                      {ticket.table_number && (
                        <p className="text-xs font-semibold text-text-muted mt-0.5">
                          Table #{ticket.table_number}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusPill status={ticket.stage} label={stageLabels[ticket.stage]} />
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${waitBadgeColor}`}>
                        WAIT: {waitLabel.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {ticket.order_note && (
                    <div className="mb-3 rounded bg-accent-primary/5 border border-accent-primary/10 p-2 text-xs">
                      <p className="font-bold text-accent-primary uppercase text-[9px] tracking-wider mb-0.5">Order Note</p>
                      <p className="text-text-primary italic font-medium">"{ticket.order_note}"</p>
                    </div>
                  )}

                  <ul className="flex-1 divide-y divide-border-subtle/50 mb-2">
                    {ticket.items.map((item) => (
                      <KitchenStatusItem key={item.kdsItemId} item={item} />
                    ))}
                  </ul>

                  <div className="mt-3 border-t border-border-subtle pt-2 flex justify-between text-[10px] font-semibold text-text-muted">
                    <span>Sent: {new Date(ticket.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {ticket.updated_at && (
                      <span>Updated: {new Date(ticket.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PosLayout>
  );
}
