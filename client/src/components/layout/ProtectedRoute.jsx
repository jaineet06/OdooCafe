import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../utils/constants";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role === ROLES.KDS_DEVICE && !path.startsWith("/kds")) {
    return <Navigate to="/kds" replace />;
  }

  if (role === ROLES.EMPLOYEE && path.startsWith("/admin")) {
    return <Navigate to="/pos" replace />;
  }

  return children;
}
