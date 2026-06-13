import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../utils/constants";

function defaultRouteForRole(role) {
  if (role === ROLES.KDS_DEVICE) return "/kds";
  if (role === ROLES.ADMIN) return "/admin/reports";
  if (role === ROLES.EMPLOYEE) return "/pos";
  return "/login";
}

export function RoleGuard({ roles, children, fallback }) {
  const { role } = useAuth();

  if (!roles.includes(role)) {
    return <Navigate to={fallback ?? defaultRouteForRole(role)} replace />;
  }

  return children;
}
