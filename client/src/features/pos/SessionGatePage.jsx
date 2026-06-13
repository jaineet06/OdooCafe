import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { sessionsApi } from "../../api/sessions.api";
import { useAuth } from "../../context/AuthContext";
import { PosLayout } from "../../components/layout/PosLayout";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { PageSkeleton } from "../../components/common/Skeletons";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

export default function SessionGatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [openingBalance, setOpeningBalance] = useState("0");
  const [closeOpen, setCloseOpen] = useState(false);
  const [closingBalance, setClosingBalance] = useState("");
  const [draftWarning, setDraftWarning] = useState(null);
  const [summary, setSummary] = useState(null);

  const { data: current, isLoading } = useQuery({
    queryKey: ["session", "current"],
    queryFn: sessionsApi.current,
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: sessionsApi.list,
    enabled: isAdmin,
  });

  const openMutation = useMutation({
    mutationFn: () => sessionsApi.open({ openingBalance: Number(openingBalance) || 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success("Session opened");
      navigate("/pos/order");
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const closeMutation = useMutation({
    mutationFn: (payload) => sessionsApi.close(current.id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
      setCloseOpen(false);
      setDraftWarning(null);
      setSummary(data.summary);
      toast.success("Session closed");
    },
    onError: (err) => {
      const drafts = err.response?.data?.errors?.[0]?.draftOrders;
      if (drafts?.length) {
        setDraftWarning(drafts);
      } else {
        toast.error(err.userMessage);
      }
    },
  });

  if (isLoading) {
    return (
      <PosLayout>
        <PageSkeleton />
      </PosLayout>
    );
  }

  if (summary) {
    return (
      <PosLayout>
        <div className="mx-auto max-w-lg p-6">
          <h1 className="font-display text-2xl text-brand-espresso">Session closed</h1>
          <div className="mt-6 space-y-2 rounded-xl bg-bg-elevated p-6 text-sm">
            <Row label="Paid orders" value={summary.totalOrders} />
            <Row label="Total revenue" value={formatCurrency(summary.totalRevenue)} />
            <Row label="Closing balance" value={formatCurrency(summary.closingBalance)} />
            {summary.paymentBreakdown?.map((p) => (
              <Row key={p.method_type} label={`${p.method_type} payments`} value={`${p.count} · ${formatCurrency(p.total)}`} />
            ))}
          </div>
          <Button className="mt-6 w-full" onClick={() => setSummary(null)}>Done</Button>
        </div>
      </PosLayout>
    );
  }

  if (current) {
    return (
      <PosLayout>
        <div className="mx-auto max-w-lg p-6 text-center">
          <h1 className="font-display mb-2 text-3xl text-brand-espresso">Session active</h1>
          <p className="mb-6 text-text-muted">Opened {formatDateTime(current.opened_at)}</p>
          <Button onClick={() => navigate("/pos/order")} className="mb-4 w-full">
            Go to POS
          </Button>
          {isAdmin && (
            <Button variant="outline" className="w-full" onClick={() => setCloseOpen(true)}>
              Close session
            </Button>
          )}
        </div>

        <Modal open={closeOpen} onClose={() => { setCloseOpen(false); setDraftWarning(null); }} title="Close session">
          {draftWarning ? (
            <div className="space-y-4">
              <p className="text-sm text-accent-danger font-medium">
                {draftWarning.length} draft order(s) must be resolved before closing:
              </p>
              <ul className="max-h-40 overflow-y-auto text-sm text-text-secondary">
                {draftWarning.map((o) => (
                  <li key={o.id}>Order #{o.order_number}{o.table_number ? ` · Table ${o.table_number}` : ""}</li>
                ))}
              </ul>
              <Button variant="danger" loading={closeMutation.isPending} onClick={() => closeMutation.mutate({ force: true, closingBalance: Number(closingBalance) || undefined })}>
                Force close anyway
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-text-muted">Enter the cash drawer count. Employees will be locked out immediately.</p>
              <Input
                label="Closing balance (₹)"
                type="number"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                placeholder="Leave blank to use paid revenue total"
              />
              <Button className="w-full" loading={closeMutation.isPending} onClick={() => closeMutation.mutate({ closingBalance: Number(closingBalance) || undefined })}>
                Confirm close
              </Button>
            </div>
          )}
        </Modal>
      </PosLayout>
    );
  }

  const lastSession = sessions?.[0];

  return (
    <PosLayout>
      <div className="mx-auto max-w-lg p-6">
        <h1 className="font-display mb-2 text-3xl text-brand-espresso">Open POS session</h1>
        {lastSession?.closed_at && (
          <p className="mb-4 text-sm text-text-muted">
            Last closed: {formatDateTime(lastSession.closed_at)} — closing{" "}
            {formatCurrency(lastSession.closing_balance)}
          </p>
        )}
        <Input
          label="Opening balance (₹)"
          type="number"
          value={openingBalance}
          onChange={(e) => setOpeningBalance(e.target.value)}
        />
        <Button className="mt-4 w-full" loading={openMutation.isPending} onClick={() => openMutation.mutate()}>
          Open session
        </Button>
      </div>
    </PosLayout>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
