import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { STORAGE_KEYS } from "../../utils/constants";
import { Button } from "../common/Button";
import { PageTransition } from "./PageTransition";

function getKdsLabel() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.KDS_DEVICE);
    if (raw) {
      const { label } = JSON.parse(raw);
      if (label) return label;
    }
  } catch {
    /* ignore */
  }
  return "Kitchen Display";
}

export function KdsLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const label = getKdsLabel();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-kds-bg text-kds-text">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-kds-border px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-kds-muted">Kitchen</p>
          <span className="font-display text-xl">{label}</span>
        </div>
        <Button variant="ghost" size="sm" icon={LogOut} onClick={handleLogout} className="!text-kds-text hover:!bg-kds-surface">
          Log out
        </Button>
      </header>
      <div className="flex-1 overflow-auto">
        <PageTransition depKey={label}>{children}</PageTransition>
      </div>
    </div>
  );
}
