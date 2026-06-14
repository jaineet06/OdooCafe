import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ClipboardList, CreditCard, Pencil, ChefHat, XCircle } from "lucide-react";
import { ordersApi } from "../../../api/orders.api";
import { usePos } from "../../../context/PosContext";
import { useAuth } from "../../../context/AuthContext";
import { PosLayout } from "../../../components/layout/PosLayout";
import { SearchInput, PageToolbar } from "../../../components/common/SearchInput";
import { Select } from "../../../components/common/Select";
import { OrderStatusPill } from "../../../components/common/Badge";
import { EmptyState } from "../../../components/common/EmptyState";
import { Drawer } from "../../../components/common/Drawer";
import { PageSkeleton } from "../../../components/common/Skeletons";
import { ReceiptDocument } from "../../../components/receipt/ReceiptDocument";
import { formatCurrency, formatDateTime } from "../../../utils/formatters";
import { useDebounce } from "../../../hooks/useDebounce";
import { Button } from "../../../components/common/Button";

export default function OrdersListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const { setCart, setEditingOrderId, setSelectedTable, setCustomerId, setNote, setTipAmount } = usePos();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedId, setSelectedId] = useState(null);

  // Sorting state
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["orders", statusFilter, debouncedSearch, sortField, sortDirection, page],
    queryFn: () =>
      ordersApi.list({
        page,
        limit,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: debouncedSearch || undefined,
        sortBy: sortField,
        sortDir: sortDirection,
      }),
  });

  const { data: detailOrder, isLoading: detailLoading } = useQuery({
    queryKey: ["orders", selectedId],
    queryFn: () => ordersApi.get(selectedId),
    enabled: !!selectedId,
  });

  const sendKds = useMutation({
    mutationFn: (orderId) => ordersApi.sendToKds(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Sent to kitchen");
    },
    onError: (err) => toast.error(err.userMessage || "Failed to send to kitchen"),
  });

  const cancel = useMutation({
    mutationFn: (orderId) => ordersApi.cancel(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order cancelled");
    },
    onError: (err) => toast.error(err.userMessage || "Failed to cancel order"),
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return " ↕";
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  const orders = useMemo(() => {
    return data?.data || [];
  }, [data]);

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
        note: i.note || "",
      }))
    );
    if (order.table_id) setSelectedTable({ id: order.table_id, table_number: order.table_number });
    setCustomerId(order.customer_id || null);
    setNote(order.note || "");
    setTipAmount(Number(order.tip_amount || 0));
    setSelectedId(null);
    navigate("/pos/order");
  };

  return (
    <PosLayout>
      <div className="mx-auto max-w-6xl p-4 lg:p-6">
        <h1 className="font-display text-2xl text-brand-espresso">Orders</h1>
        <p className="mt-1 text-sm text-text-muted">
          Showing {orders.length} of {data?.meta?.total || 0} orders
        </p>

        <PageToolbar className="mt-6">
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search order #, table, or customer…"
            className="min-w-[200px] flex-1"
          />
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="!w-auto min-w-[140px]"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </PageToolbar>

        {isLoading ? (
          <PageSkeleton />
        ) : orders.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No orders" description="Orders will appear here once created." />
        ) : (
          <div className="mt-6">
            <div className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-elevated shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-bg-sunken border-b border-border-subtle text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    <tr>
                      <th className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleSort("order_number")}
                          className="flex items-center gap-1 hover:text-accent-primary font-bold uppercase cursor-pointer"
                        >
                          Order #{getSortIcon("order_number")}
                        </button>
                      </th>
                      <th className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleSort("created_at")}
                          className="flex items-center gap-1 hover:text-accent-primary font-bold uppercase cursor-pointer"
                        >
                          Time{getSortIcon("created_at")}
                        </button>
                      </th>
                      <th className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleSort("table_number")}
                          className="flex items-center gap-1 hover:text-accent-primary font-bold uppercase cursor-pointer"
                        >
                          Table{getSortIcon("table_number")}
                        </button>
                      </th>
                      <th className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleSort("customer_name")}
                          className="flex items-center gap-1 hover:text-accent-primary font-bold uppercase cursor-pointer"
                        >
                          Customer{getSortIcon("customer_name")}
                        </button>
                      </th>
                      <th className="px-6 py-4">Items</th>
                      <th className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSort("total")}
                          className="flex items-center gap-1 hover:text-accent-primary font-bold uppercase ml-auto cursor-pointer"
                        >
                          Total{getSortIcon("total")}
                        </button>
                      </th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle text-text-secondary bg-bg-elevated">
                    {orders.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => setSelectedId(o.id)}
                        className="hover:bg-bg-base/50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-brand-espresso">#{o.order_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatDateTime(o.created_at)}</td>
                        <td className="px-6 py-4">{o.table_number ? `Table ${o.table_number}` : "—"}</td>
                        <td className="px-6 py-4 truncate max-w-[150px]">{o.customer_name || "Walk-in"}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold block text-text-primary">
                            {o.item_count ?? 0} item{(o.item_count ?? 0) !== 1 ? "s" : ""}
                          </span>
                          {o.item_preview && (
                            <span className="text-xs text-text-muted line-clamp-1">
                              {o.item_preview}{(o.item_count ?? 0) > 3 ? ` +${(o.item_count ?? 0) - 3} more` : ""}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-display text-base font-bold text-accent-primary whitespace-nowrap">
                          {formatCurrency(o.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <OrderStatusPill paymentStatus={o.status} kdsStage={o.kds_stage} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {data?.meta && data.meta.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-border-subtle/60 pt-4 text-sm text-text-secondary">
                <span>
                  Page <strong>{page}</strong> of <strong>{data.meta.totalPages}</strong>
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === data.meta.totalPages}
                    onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
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
