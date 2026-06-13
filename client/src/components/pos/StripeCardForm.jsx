import { useEffect, useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "../common/Button";

function CardForm({ onSuccess, onError, disabled }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    setLoading(false);
    if (error) {
      onError(error.message || "Payment failed");
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      onSuccess();
    } else {
      onSuccess(); // webhook will finalize; poll handles
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
      <Button className="w-full" size="lg" loading={loading} disabled={disabled || loading} onClick={handlePay}>
        Pay now
      </Button>
    </div>
  );
}

export function StripeCardForm({ clientSecret, publishableKey, onSuccess, onError, disabled }) {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    if (publishableKey) setStripePromise(loadStripe(publishableKey));
  }, [publishableKey]);

  if (!publishableKey) {
    return <p className="text-sm text-accent-danger">Stripe publishable key not configured on server.</p>;
  }
  if (!stripePromise || !clientSecret) return null;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CardForm onSuccess={onSuccess} onError={onError} disabled={disabled} />
    </Elements>
  );
}
