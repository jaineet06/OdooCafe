import { useNavigate, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import { useSession } from "../../context/SessionContext";
import { Button } from "../common/Button";

export function SessionLockOverlay() {
  const { locked, isLoading, session } = useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isSessionGate = pathname === "/pos";
  const show = !isSessionGate && (locked || (!isLoading && !session));

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-text-primary/60 p-6 backdrop-blur-sm">
      <div className="max-w-md rounded-2xl bg-bg-elevated p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-warning/15 text-accent-warning">
          <Lock size={28} />
        </div>
        <h2 className="font-display text-2xl text-brand-espresso">Session closed</h2>
        <p className="mt-2 text-sm text-text-muted">
          {session
            ? "This register session has ended. Wait for an admin to open a new session."
            : "No active POS session. An admin must open a session before orders can be taken."}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={() => navigate("/pos")}>Go to session screen</Button>
          <Button variant="ghost" onClick={() => navigate("/login")}>
            Return to login
          </Button>
        </div>
      </div>
    </div>
  );
}
