import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { RoleGuard } from "../components/layout/RoleGuard";
import { SessionProvider } from "../context/SessionContext";
import { ROLES } from "../utils/constants";
import { useAuth } from "../context/AuthContext";
import { PageSkeleton } from "../components/common/Skeletons";

const LoginPage = lazy(() => import("../features/auth/LoginPage"));
const SignupPage = lazy(() => import("../features/auth/SignupPage"));
const SessionGatePage = lazy(() => import("../features/pos/SessionGatePage"));
const OrderViewPage = lazy(() => import("../features/pos/order-view/OrderViewPage"));
const OrdersListPage = lazy(() => import("../features/pos/orders-list/OrdersListPage"));
const OrderDetailPage = lazy(() => import("../features/pos/orders-list/OrderDetailPage"));
const PaymentPage = lazy(() => import("../features/pos/payment/PaymentPage"));
const CustomersPage = lazy(() => import("../features/pos/customers/CustomersPage"));
const TableViewPage = lazy(() => import("../features/pos/TableViewPage"));
const ProductsAdminPage = lazy(() => import("../features/products/ProductsAdminPage"));
const CategoriesAdminPage = lazy(() => import("../features/categories/CategoriesAdminPage"));
const PaymentMethodsPage = lazy(() => import("../features/payment-methods/PaymentMethodsPage"));
const FloorsTablesPage = lazy(() => import("../features/floors-tables/FloorsTablesPage"));
const CouponsPromotionsPage = lazy(() => import("../features/coupons-promotions/CouponsPromotionsPage"));
const UsersAdminPage = lazy(() => import("../features/users-employees/UsersAdminPage"));
const KdsRegisterPage = lazy(() => import("../features/kds/KdsRegisterPage"));
const KdsDisplayPage = lazy(() => import("../features/kds/KdsDisplayPage"));
const KdsSetupPage = lazy(() => import("../features/kds/KdsSetupPage"));
const ReportsPage = lazy(() => import("../features/reports/ReportsPage"));

function HomeRedirect() {
  const { role, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === ROLES.KDS_DEVICE) return <Navigate to="/kds" replace />;
  if (role === ROLES.ADMIN) return <Navigate to="/admin/reports" replace />;
  return <Navigate to="/pos" replace />;
}

function Lazy({ children }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

function AdminRoute({ children }) {
  return (
    <ProtectedRoute>
      <RoleGuard roles={[ROLES.ADMIN]}>{children}</RoleGuard>
    </ProtectedRoute>
  );
}

function PosRoute({ children }) {
  return (
    <ProtectedRoute>
      <RoleGuard roles={[ROLES.ADMIN, ROLES.EMPLOYEE]}>{children}</RoleGuard>
    </ProtectedRoute>
  );
}

function KdsRoute({ children }) {
  return (
    <ProtectedRoute>
      <RoleGuard roles={[ROLES.KDS_DEVICE]}>{children}</RoleGuard>
    </ProtectedRoute>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <SessionProvider>
      <Routes>
        <Route path="/login" element={<Lazy><LoginPage /></Lazy>} />
        <Route path="/signup" element={<Lazy><SignupPage /></Lazy>} />
        <Route path="/" element={<HomeRedirect />} />

        {/* Admin panel */}
        <Route path="/admin" element={<Navigate to="/admin/reports" replace />} />
        <Route path="/admin/reports" element={<AdminRoute><Lazy><ReportsPage /></Lazy></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><Lazy><ProductsAdminPage /></Lazy></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><Lazy><CategoriesAdminPage /></Lazy></AdminRoute>} />
        <Route path="/admin/payment-methods" element={<AdminRoute><Lazy><PaymentMethodsPage /></Lazy></AdminRoute>} />
        <Route path="/admin/floors" element={<AdminRoute><Lazy><FloorsTablesPage /></Lazy></AdminRoute>} />
        <Route path="/admin/coupons" element={<AdminRoute><Lazy><CouponsPromotionsPage /></Lazy></AdminRoute>} />
        <Route path="/admin/promotions" element={<Navigate to="/admin/coupons" replace />} />
        <Route path="/admin/users" element={<AdminRoute><Lazy><UsersAdminPage /></Lazy></AdminRoute>} />
        <Route path="/admin/kds-register" element={<AdminRoute><Lazy><KdsRegisterPage /></Lazy></AdminRoute>} />

        {/* POS terminal */}
        <Route path="/pos" element={<PosRoute><Lazy><SessionGatePage /></Lazy></PosRoute>} />
        <Route path="/pos/order" element={<PosRoute><Lazy><OrderViewPage /></Lazy></PosRoute>} />
        <Route path="/pos/orders" element={<PosRoute><Lazy><OrdersListPage /></Lazy></PosRoute>} />
        <Route path="/pos/orders/:id" element={<PosRoute><Lazy><OrderDetailPage /></Lazy></PosRoute>} />
        <Route path="/pos/payment/:orderId" element={<PosRoute><Lazy><PaymentPage /></Lazy></PosRoute>} />
        <Route path="/pos/customers" element={<PosRoute><Lazy><CustomersPage /></Lazy></PosRoute>} />
        <Route path="/pos/tables" element={<PosRoute><Lazy><TableViewPage /></Lazy></PosRoute>} />

        {/* Kitchen display — setup is public; display requires KDS token */}
        <Route path="/kds/setup" element={<Lazy><KdsSetupPage /></Lazy>} />
        <Route path="/kds" element={<KdsRoute><Lazy><KdsDisplayPage /></Lazy></KdsRoute>} />

        {/* Legacy redirects */}
        <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />
        <Route path="/kds/register" element={<Navigate to="/admin/kds-register" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}
