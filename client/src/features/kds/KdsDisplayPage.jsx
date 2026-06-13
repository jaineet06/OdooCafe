import { useState } from "react";
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
    <li className={`flex items-center justify-between text-lg ${item.isCompleted ? "opacity-55 line-through" : ""}`}>
      <span>{item.quantity}× {item.productName}</span>
      {!item.isCompleted && (
        <Button
          size="sm"
          variant="secondary"
          className="!bg-kds-surface !text-kds-text"
          loading={completingId === item.kdsItemId}
          onClick={() => onComplete({ kdsOrderId, itemId: item.kdsItemId })}
        >
          Done
        </Button>
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

  const filtered = tickets?.filter((t) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return String(t.order_number).includes(q) || t.table_number?.includes(q);
  });

  const nextStage = (current) => STAGES[Math.min(STAGES.indexOf(current) + 1, STAGES.length - 1)];

  return (
    <KdsLayout>
      <div className="p-6">
        <div className="mb-6 flex justify-end">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order / table…"
            className="max-w-xs [&_input]:!border-kds-border [&_input]:!bg-kds-surface [&_input]:!text-kds-text"
          />
        </div>

        {isLoading ? (
          <CardSkeleton count={4} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered?.map((ticket) => (
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
                  <StatusPill status={ticket.stage} label={stageLabels[ticket.stage]} />
                </div>

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
            ))}
          </div>
        )}
      </div>
    </KdsLayout>
  );
}
