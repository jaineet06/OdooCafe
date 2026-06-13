import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Monitor, KeyRound, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/common/Button";

export default function KdsSetupPage() {
  const { setKdsDeviceToken, isKds } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState("");

  const handleConnect = () => {
    const trimmed = token.trim();
    if (!trimmed) {
      toast.error("Paste the kitchen display token from admin");
      return;
    }
    setKdsDeviceToken(trimmed, { label: "Kitchen display" });
    toast.success("Kitchen display connected!");
    navigate("/kds", { replace: true });
  };

  if (isKds) {
    navigate("/kds", { replace: true });
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-espresso via-[#4a2f1a] to-espresso p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-surface shadow-2xl">
        <div className="bg-gradient-to-r from-terracotta to-gold px-8 py-10 text-white">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <Monitor size={28} />
          </div>
          <h1 className="font-display text-3xl">Kitchen display setup</h1>
          <p className="mt-2 text-sm text-white/85">
            No technical steps needed — just paste the token your admin copied from the back office.
          </p>
        </div>

        <div className="p-8">
          <ol className="mb-6 space-y-3 text-sm text-charcoal-light">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-espresso text-xs font-bold text-cream">1</span>
              Ask your manager to open <strong className="text-charcoal">Admin → KDS Registration</strong>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-espresso text-xs font-bold text-cream">2</span>
              Click <strong className="text-charcoal">Register device</strong> and copy the token
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-espresso text-xs font-bold text-cream">3</span>
              Paste it below and tap Connect
            </li>
          </ol>

          <div className="relative">
            <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-light" />
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste kitchen display token here…"
              rows={4}
              className="w-full resize-none rounded-xl border border-border bg-cream/50 py-3 pl-10 pr-4 font-mono text-xs focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
            />
          </div>

          <Button className="mt-4 w-full gap-2 py-3.5 text-base" onClick={handleConnect}>
            Connect kitchen display <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
