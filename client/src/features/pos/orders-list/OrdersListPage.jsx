import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { LayoutGrid, CreditCard, Pencil, ChefHat, XCircle } from "lucide-react";
import { ordersApi } from "../../../api/orders.api";
import { usePos } from "../../../context/PosContext";
import { useAuth } from "../../../context/AuthContext";
import { PosLayout } from "../../../components/layout/PosLayout";
import { SearchInput, PageToolbar } from "../../../components/common/SearchInput";
import { Select } from "../../../components/common/Select";
import { OrderStatusPill } from "../../../components/common/Badge";
import { EmptyState } from "../../../components/common/EmptyState";
import { Card } from "../../../components/common/Card";
import { Button } from "../../../components/common/Button";
import { Drawer } from "../../../components/common/Drawer";
import { CardSkeleton } from "../../../components/common/Skeletons";
import { ReceiptDocument } from "../../../components/receipt/ReceiptDocument";
import { formatCurrency, formatDateTime } from "../../../utils/formatters";
import { useDebounce } from "../../../hooks/useDebounce";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "total_desc", label: "Highest total" },
  { value: "total_asc", label: "Lowest total" },
];

export default function OrdersListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const { setCart, setEditingOrderId, setSelectedTable } = usePos();

  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedId, setSelectedId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", statusFilter],
    queryFn: () => ordersApi.list({ limit: 100, status: statusFilter !== "all" ? statusFilter : undefined }),
  });

  const { data: detailOrder, isLoading: detailLoading } = useQuery({
    queryKey: ["orders", selectedId],
    queryFn: () => ordersApi.get(selectedId),
    enabled: !!selectedId,
  });

  const sendKds = useMutation({
    mutationFn: (id) => ordersApi.sendToKds(id),
    onSuccess: () => toast.success("Sent to kitchen"),
    onError: (err) => toast.error(err.userMessage),
  });

  const cancel = useMutation({
    mutationFn: (id) => ordersApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      setSelectedId(null);
      toast.success("Order cancelled");
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const orders = useMemo(() => {
    let list = data?.data || [];
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (o) =>
          String(o.order_number).includes(q) ||
          o.table_number?.toString().includes(q) ||
          o.customer_name?.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    if (sortBy === "oldest") sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else if (sortBy === "total_desc") sorted.sort((a, b) => Number(b.total) - Number(a.total));
    else if (sortBy === "total_asc") sorted.sort((a, b) => Number(a.total) - Number(b.total));
    else sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return sorted;
  }, [data, debouncedSearch, sortBy]);

  const loadForEdit = (order) => {
    setEditingOrderId(order.id);
    setCart(
      order.items.map((i) => ({
        productId: i.product_id,
        name: i.product_name,
        unitPrice: Number(i.unit_price),
        taxRate: Number(i.tax_rate),
        quantity: i.quantity,
        imageUrl: i.image_url || null,
      }))
    );
    if (order.table_id) setSelectedTable({ id: order.table_id, table_number: order.table_number });
    setSelectedId(null);
    navigate("/pos/order");
  };

  return (
    <PosLayout>
      <div className="mx-auto max-w-6xl p-4 lg:p-6">
        <h1 className="font-display text-2xl text-brand-espresso">Orders</h1>
        <p className="mt-1 text-sm text-text-muted">{orders.length} orders</p>

        <PageToolbar className="mt-6">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, table, or customer…"
            className="min-w-[200px] flex-1"
          />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="!w-auto min-w-[140px]">
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="!w-auto min-w-[150px]">
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </PageToolbar>

        {isLoading ? (
          <CardSkeleton count={6} />
        ) : orders.length === 0 ? (
          <EmptyState icon={LayoutGrid} title="No orders" description="Orders will appear here once created." />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelectedId(o.id)}
                className="order-card text-left"
              >
                <Card padding="none" className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-2 p-4 pb-2">
                    <div>
                      <p className="font-display text-lg text-brand-espresso">#{o.order_number}</p>
                      <p className="text-xs text-text-muted">{formatDateTime(o.created_at)}</p>
                    </div>
                    <OrderStatusPill paymentStatus={o.status} kdsStage={o.kds_stage} />
                  </div>
                  <div className="space-y-1 px-4 pb-3 text-sm text-text-secondary">
                    {o.table_number && <p>Table {o.table_number}</p>}
                    <p>{o.customer_name || "Walk-in"}</p>
                    <p className="text-xs text-text-muted">
                      {o.item_count ?? 0} item{(o.item_count ?? 0) !== 1 ? "s" : ""}
                    </p>
                    {o.item_preview && (
                      <p className="line-clamp-1 text-xs text-text-muted">
                        {o.item_preview}{(o.item_count ?? 0) > 3 ? ` +${(o.item_count ?? 0) - 3} more` : ""}
                      </p>
                    )}
                  </div>
                  <div className="border-t border-border-subtle bg-bg-base px-4 py-3">
                    <p className="font-display text-xl text-accent-primary">{formatCurrency(o.total)}</p>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>

      <Drawer open={!!selectedId} onClose={() => setSelectedId(null)} title={detailOrder ? `Order #${detailOrder.order_number}` : "Order"} wide>
        {detailLoading || !detailOrder ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            <ReceiptDocument order={detailOrder} tenant={{ name: "Odoo Cafe" }} type={detailOrder.status === "paid" ? "receipt" : "bill"} />
            <div className="flex flex-col gap-2">
              {detailOrder.status === "draft" && (
                <>
                  <Button icon={CreditCard} onClick={() => { setSelectedId(null); navigate(`/pos/payment/${detailOrder.id}`); }}>
                    Take payment
                  </Button>
                  <Button variant="secondary" icon={Pencil} onClick={() => loadForEdit(detailOrder)}>Edit order</Button>
                  <Button variant="secondary" icon={ChefHat} loading={sendKds.isPending} onClick={() => sendKds.mutate(detailOrder.id)}>
                    Send to kitchen
                  </Button>
                  {isAdmin && (
                    <Button variant="danger" icon={XCircle} loading={cancel.isPending} onClick={() => cancel.mutate(detailOrder.id)}>
                      Cancel order
                    </Button>
                  )}
                </>
              )}
              <Button variant="outline" onClick={() => navigate(`/pos/orders/${detailOrder.id}`)}>Open full page</Button>
            </div>
          </div>
        )}
      </Drawer>
    </PosLayout>
  );
}
