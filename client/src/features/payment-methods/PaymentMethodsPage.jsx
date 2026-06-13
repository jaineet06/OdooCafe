import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useState } from "react";
import { paymentMethodsApi } from "../../api/config.api";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Toggle } from "../../components/common/Toggle";
import { ListRow } from "../../components/common/Card";
import { TableSkeleton } from "../../components/common/Skeletons";

export default function PaymentMethodsPage() {
  const queryClient = useQueryClient();
  const [upiId, setUpiId] = useState("");

  const { data: methods, isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: paymentMethodsApi.list,
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => paymentMethodsApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Updated");
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const upiMutation = useMutation({
    mutationFn: (id) => paymentMethodsApi.updateUpiId(id, upiId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("UPI ID saved");
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const upiMethod = methods?.find((m) => m.method_type === "upi");

  return (
    <AdminLayout title="Payment methods">
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="space-y-4">
          {methods?.map((m) => (
            <ListRow key={m.id}>
              <span className="font-semibold capitalize">{m.method_type}</span>
              <Toggle
                checked={m.is_enabled}
                onChange={() => toggleMutation.mutate(m.id)}
              />
            </ListRow>
          ))}
          {upiMethod && (
            <div className="rounded-xl border border-border-subtle bg-bg-elevated p-6">
              <Input
                label="UPI ID"
                value={upiId || upiMethod.upi_id || ""}
                onChange={(e) => setUpiId(e.target.value)}
                hint="Used for QR code generation at checkout"
              />
              <Button className="mt-4" variant="secondary" onClick={() => upiMutation.mutate(upiMethod.id)} loading={upiMutation.isPending}>
                Save UPI ID
              </Button>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
