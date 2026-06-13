import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowLeft, ArrowRight, Banknote, CreditCard, Smartphone, Mail, Printer, FileText, Check,
} from "lucide-react";
import { ordersApi } from "../../../api/orders.api";
import { paymentsApi } from "../../../api/payments.api";
import { paymentMethodsApi, receiptsApi } from "../../../api/config.api";
import { useAuth } from "../../../context/AuthContext";
import { PosLayout } from "../../../components/layout/PosLayout";
import { Button } from "../../../components/common/Button";
import { Input } from "../../../components/common/Input";
import { Card } from "../../../components/common/Card";
import { ReceiptDocument } from "../../../components/receipt/ReceiptDocument";
import { StripeCardForm } from "../../../components/pos/StripeCardForm";
import { useAwaitPayment } from "../../../hooks/useAwaitPayment";
import { formatCurrency } from "../../../utils/formatters";
import { openReceiptPdf, openBillPdf } from "../../../utils/receipt";

const STEPS = ["Review", "Method", "Payment", "Receipt"];

const METHODS = {
  cash: { label: "Cash", icon: Banknote },
  card: { label: "Card", icon: CreditCard },
  upi: { label: "UPI", icon: Smartphone },
  bill: { label: "Print bill only", icon: FileText },
};

export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const [step, setStep] = useState(0);
  const [method, setMethod] = useState(null);
  const [amountTendered, setAmountTendered] = useState("");
  const [upiRef, setUpiRef] = useState("");
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [cardProcessing, setCardProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [paid, setPaid] = useState(false);

  const { data: order, refetch } = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => ordersApi.get(orderId),
  });

  const { data: stripeConfig } = useQuery({
    queryKey: ["stripe-config"],
    queryFn: paymentsApi.config,
  });

  const { data: payMethods = [] } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: paymentMethodsApi.list,
  });

  const enabledTypes = new Set(payMethods.filter((m) => m.is_enabled).map((m) => m.method_type));
  enabledTypes.add("bill");

  const { data: upiQr, isLoading: qrLoading, isError: qrError } = useQuery({
    queryKey: ["upi-qr", orderId],
    queryFn: () => paymentsApi.upiQr(orderId),
    enabled: method === "upi" && step === 2,
  });

  useAwaitPayment(orderId, token, {
    enabled: cardProcessing,
    onPaid: () => {
      setCardProcessing(false);
      setPaid(true);
      refetch();
      setStep(3);
      toast.success("Card payment confirmed!");
    },
  });

  useEffect(() => {
    if (order?.status === "paid") setPaid(true);
  }, [order?.status]);

  const cashMutation = useMutation({
    mutationFn: () => paymentsApi.confirmCash({ orderId, amountTendered: Number(amountTendered) }),
    onSuccess: () => finishPayment(),
    onError: (err) => toast.error(err.userMessage),
  });

  const upiMutation = useMutation({
    mutationFn: () => paymentsApi.confirmUpi({ orderId, upiRef }),
    onSuccess: () => finishPayment(),
    onError: (err) => toast.error(err.userMessage),
  });

  const intentMutation = useMutation({
    mutationFn: () => paymentsApi.createIntent(orderId),
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setCardProcessing(true);
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const emailMutation = useMutation({
    mutationFn: () => receiptsApi.email(orderId, email),
    onSuccess: () => {
      setEmailSent(true);
      toast.success("Receipt emailed successfully");
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const finishPayment = () => {
    setPaid(true);
    queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
    queryClient.invalidateQueries({ queryKey: ["tables"] });
    refetch();
    setStep(3);
    toast.success("Payment recorded!");
  };

  const handleBillOnly = async () => {
    try {
      await openBillPdf(orderId);
      setStep(3);
      toast.success("Bill generated — order remains unpaid");
    } catch {
      toast.error("Could not generate bill");
    }
  };

  const next = () => {
    if (step === 1 && !method) return toast.error("Select a payment method");
    if (step === 1 && method === "bill") {
      setStep(2);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    if (step === 3 && paid) return navigate(`/pos/orders/${orderId}`);
    if (step > 0 && !(step === 3 && paid)) setStep((s) => s - 1);
  };

  if (!order) {
    return <PosLayout><div className="flex justify-center p-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" /></div></PosLayout>;
  }

  const change = Number(amountTendered) - Number(order.total);
  const canEmail = paid && order.status === "paid";

  return (
    <PosLayout>
      <div className="mx-auto max-w-2xl p-4 lg:p-6">
        <Link to={`/pos/orders/${orderId}`} className="inline-flex items-center gap-1 text-sm font-medium text-accent-primary hover:underline">
          <ArrowLeft size={16} /> Order #{order.order_number}
        </Link>

        <Stepper current={step} />

        <div className="mt-6">
          {step === 0 && (
            <Card>
              <h2 className="font-display text-xl text-brand-espresso">Review order</h2>
              <ul className="mt-4 divide-y divide-border-subtle">
                {order.items?.map((i) => (
                  <li key={i.id} className="flex justify-between py-3 text-sm">
                    <span>{i.product_name} × {i.quantity}</span>
                    <span>{formatCurrency(i.line_total)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-1 border-t border-border-subtle pt-4 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(order.tax_total)}</span></div>
                {order.discount_total > 0 && <div className="flex justify-between text-accent-primary"><span>Discount</span><span>-{formatCurrency(order.discount_total)}</span></div>}
                <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-accent-primary">{formatCurrency(order.total)}</span></div>
              </div>
            </Card>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
              {Object.entries(METHODS).map(([key, meta]) => {
                if (key !== "bill" && !enabledTypes.has(key)) return null;
                const Icon = meta.icon;
                const active = method === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMethod(key)}
                    className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
                      active ? "border-accent-primary bg-accent-primary/8" : "border-border-subtle bg-bg-elevated hover:border-accent-primary/40"
                    }`}
                  >
                    <Icon size={28} strokeWidth={1.75} />
                    <span className="text-center text-sm font-semibold">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && method === "cash" && (
            <Card className="space-y-4">
              <Input label="Amount received" type="number" value={amountTendered} onChange={(e) => setAmountTendered(e.target.value)} />
              {change >= 0 && amountTendered && (
                <p className="text-center font-display text-2xl text-accent-success">Change: {formatCurrency(change)}</p>
              )}
              <Button className="w-full" size="lg" loading={cashMutation.isPending} disabled={!amountTendered || change < 0} onClick={() => cashMutation.mutate()}>
                Confirm cash payment
              </Button>
            </Card>
          )}

          {step === 2 && method === "upi" && (
            <Card className="space-y-4">
              {qrLoading && <div className="flex justify-center py-8"><div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" /></div>}
              {qrError && <p className="text-sm text-accent-danger">QR failed — check UPI ID in admin.</p>}
              {upiQr?.qrDataUrl && <img src={upiQr.qrDataUrl} alt="UPI QR" className="mx-auto h-52 rounded-xl border border-border-subtle" />}
              <Input label="UPI reference" value={upiRef} onChange={(e) => setUpiRef(e.target.value)} />
              <Button className="w-full" size="lg" loading={upiMutation.isPending} disabled={!upiRef} onClick={() => upiMutation.mutate()}>Confirm UPI</Button>
            </Card>
          )}

          {step === 2 && method === "card" && (
            <Card>
              {!clientSecret ? (
                <Button className="w-full" size="lg" loading={intentMutation.isPending} onClick={() => intentMutation.mutate()}>
                  Initialize card payment
                </Button>
              ) : (
                <div className="space-y-4">
                  {cardProcessing && (
                    <p className="text-center text-sm text-text-muted">Processing payment — waiting for confirmation…</p>
                  )}
                  <StripeCardForm
                    clientSecret={clientSecret}
                    publishableKey={stripeConfig?.publishableKey}
                    disabled={cardProcessing}
                    onSuccess={() => setCardProcessing(true)}
                    onError={(msg) => toast.error(msg)}
                  />
                  {cardProcessing && (
                    <div className="flex justify-center py-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {step === 2 && method === "bill" && (
            <Card className="space-y-4 text-center">
              <p className="text-sm text-text-muted">Generate an unpaid bill. The order stays in draft until payment is taken later.</p>
              <Button className="w-full" size="lg" icon={FileText} onClick={handleBillOnly}>Generate &amp; print bill</Button>
            </Card>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-2 text-accent-success">
                <Check size={24} /> <span className="font-semibold">{paid ? "Payment complete" : "Bill generated"}</span>
              </div>
              <ReceiptDocument order={order} tenant={{ name: "Odoo Cafe" }} type={paid ? "receipt" : "bill"} />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email for receipt" disabled={!canEmail || emailSent} />
                <Button variant="secondary" icon={Mail} disabled={!canEmail || !email || emailMutation.isPending || emailSent} loading={emailMutation.isPending} onClick={() => emailMutation.mutate()}>
                  {emailSent ? "Sent" : "Email"}
                </Button>
                <Button variant="outline" icon={Printer} onClick={() => (paid ? openReceiptPdf(orderId) : openBillPdf(orderId)).catch(() => toast.error("Print failed"))}>
                  Print
                </Button>
              </div>
              <Button className="w-full" onClick={() => navigate(`/pos/orders/${orderId}`)}>Done</Button>
            </div>
          )}
        </div>

        {step < 3 && (
          <div className="mt-6 flex gap-3">
            {step > 0 && <Button variant="secondary" onClick={back}>Back</Button>}
            {step < 2 && <Button className="flex-1" icon={ArrowRight} onClick={next}>Continue</Button>}
          </div>
        )}
      </div>
    </PosLayout>
  );
}

function Stepper({ current }) {
  return (
    <div className="mt-6 flex items-center justify-between">
      {STEPS.map((label, i) => (
        <div key={label} className="flex flex-1 items-center">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
            i <= current ? "bg-accent-primary text-bg-elevated" : "bg-bg-sunken text-text-muted"
          }`}>{i + 1}</div>
          <span className={`ml-2 hidden text-xs font-medium sm:inline ${i === current ? "text-brand-espresso" : "text-text-muted"}`}>{label}</span>
          {i < STEPS.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${i < current ? "bg-accent-primary" : "bg-border-subtle"}`} />}
        </div>
      ))}
    </div>
  );
}
