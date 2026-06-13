import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Printer, ChefHat, CreditCard, Pencil, XCircle, ArrowLeft } from "lucide-react";
import { ordersApi } from "../../../api/orders.api";
import { usePos } from "../../../context/PosContext";
import { useAuth } from "../../../context/AuthContext";
import { PosLayout } from "../../../components/layout/PosLayout";
import { Button } from "../../../components/common/Button";
import { Card } from "../../../components/common/Card";
import { OrderStatusPill } from "../../../components/common/Badge";
import { PageSkeleton } from "../../../components/common/Skeletons";
import { formatCurrency, formatDateTime } from "../../../utils/formatters";
import { openReceiptPdf } from "../../../utils/receipt";

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const { setCart, setEditingOrderId, setSelectedTable } = usePos();
  const [printing, setPrinting] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["orders", id],
    queryFn: () => ordersApi.get(id),
  });

  const sendKds = useMutation({
    mutationFn: () => ordersApi.sendToKds(id),
    onSuccess: () => toast.success("Sent to kitchen"),
    onError: (err) => toast.error(err.userMessage),
  });

  const cancel = useMutation({
    mutationFn: () => ordersApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Order cancelled");
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await openReceiptPdf(id);
    } catch {
      toast.error("Could not open receipt");
    } finally {
      setPrinting(false);
    }
  };

  const loadForEdit = () => {
    setEditingOrderId(id);
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
    navigate("/pos/order");
  };

  if (isLoading) return <PosLayout><PageSkeleton /></PosLayout>;
  if (!order) return <PosLayout><p className="p-6 text-text-muted">Order not found</p></PosLayout>;

  return (
    <PosLayout>
      <div className="mx-auto max-w-lg p-4 lg:p-6">
        <Link to="/pos/orders" className="inline-flex items-center gap-1 text-sm font-medium text-accent-primary hover:underline">
          <ArrowLeft size={16} /> All orders
        </Link>

        <Card className="mt-4" padding="none">
          <div className="border-b border-border-subtle px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-xl text-brand-espresso">Order #{order.order_number}</h1>
                <p className="mt-1 text-sm text-text-muted">{formatDateTime(order.created_at)}</p>
              </div>
              <OrderStatusPill paymentStatus={order.status} kdsStage={order.kds_stage} />
            </div>
            {order.table_number && <p className="mt-2 text-sm font-medium text-accent-success">Table #{order.table_number}</p>}
          </div>

          <ul className="divide-y divide-border-subtle px-6">
            {order.items?.map((i) => (
              <li key={i.id} className="flex justify-between py-3 text-sm">
                <span className="font-medium">{i.product_name} × {i.quantity}</span>
                <span className="text-text-muted">{formatCurrency(i.line_total)}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 border-t border-border-subtle bg-bg-base px-6 py-4 text-sm">
            <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
            <Row label="Tax" value={formatCurrency(order.tax_total)} />
            {order.discount_total > 0 && <Row label="Discount" value={`-${formatCurrency(order.discount_total)}`} highlight />}
            <div className="flex justify-between border-t border-border-subtle pt-2 text-lg font-bold">
              <span>Total</span>
              <span className="text-accent-primary">{formatCurrency(order.total)}</span>
            </div>
          </div>

          <div className="space-y-2 p-6">
            {order.status === "draft" && (
              <>
                <Button className="w-full" size="lg" icon={CreditCard} onClick={() => navigate(`/pos/payment/${id}`)}>Take payment</Button>
                <Button variant="secondary" className="w-full" icon={Pencil} onClick={loadForEdit}>Edit order</Button>
                <Button variant="secondary" className="w-full" icon={ChefHat} onClick={() => sendKds.mutate()} loading={sendKds.isPending}>Send to kitchen</Button>
                {isAdmin && <Button variant="danger" className="w-full" icon={XCircle} onClick={() => cancel.mutate()}>Cancel order</Button>}
              </>
            )}
            {order.status === "paid" && (
              <Button variant="outline" className="w-full" icon={Printer} onClick={handlePrint} loading={printing}>Print receipt</Button>
            )}
          </div>
        </Card>
      </div>
    </PosLayout>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className={`flex justify-between ${highlight ? "font-medium text-accent-primary" : "text-text-secondary"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
