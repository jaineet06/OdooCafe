import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Copy, Check, Monitor, ExternalLink } from "lucide-react";
import { authApi } from "../../api/auth.api";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/common/Button";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function KdsRegisterPage() {
  const [token, setToken] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("");
  const [copied, setCopied] = useState(false);

  const register = useMutation({
    mutationFn: authApi.registerKds,
    onSuccess: (data) => {
      setToken(data.token);
      setDeviceLabel(data.device?.label || "Kitchen display");
      toast.success("Device registered — copy the token to your kitchen tablet");
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const copyToken = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    toast.success("Token copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const setupUrl = `${window.location.origin}/kds/setup`;

  return (
    <AdminLayout title="Kitchen display">
      <div className="max-w-2xl">
        <div className="mb-6 rounded-2xl border border-border bg-gradient-to-br from-cream to-surface p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-espresso text-cream">
              <Monitor size={24} />
            </div>
            <div>
              <h2 className="font-display text-xl text-espresso">Set up a kitchen tablet</h2>
              <p className="mt-1 text-sm text-charcoal-light">
                Register once, copy the token, then on the kitchen tablet open the setup page and paste it. No developer tools required.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={() => register.mutate()} disabled={register.isPending} className="mb-6">
          {register.isPending ? "Registering…" : "Register new kitchen display"}
        </Button>

        {token && (
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-sage/40 bg-sage/5 p-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-sage">Device token</p>
              <code className="block max-h-32 overflow-auto break-all rounded-lg bg-surface p-3 text-xs leading-relaxed">
                {token}
              </code>
              <Button variant="secondary" className="mt-3 gap-2" onClick={copyToken}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy token"}
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="mb-2 font-semibold text-espresso">On the kitchen tablet</p>
              <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm text-charcoal-light">
                <li>Open this link in the tablet browser:</li>
              </ol>
              <div className="flex flex-wrap items-center gap-2">
                <code className="flex-1 rounded-lg bg-cream-dark px-3 py-2 text-sm">{setupUrl}</code>
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(setupUrl);
                    toast.success("Setup link copied");
                  }}
                >
                  Copy link
                </Button>
                <Link to="/kds/setup" target="_blank">
                  <Button variant="outline" className="gap-2">
                    <ExternalLink size={16} /> Open setup
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-charcoal-light">
                Paste the token above and tap <strong>Connect</strong>. The display stays logged in for 365 days.
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
