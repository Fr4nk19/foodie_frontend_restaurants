import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PrivateRoute, AdminRoute } from './PrivateRoute';
import Layout from '../components/layout/Layout';

// Auth
import LoginPage from '../pages/auth/LoginPage';

// Admin
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage';
import AdminTablesPage from '../pages/admin/AdminTablesPage';
import AdminStaffPage from '../pages/admin/AdminStaffPage';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import AdminProductCategoriesPage from '../pages/admin/AdminProductCategoriesPage';
import AdminBranchesPage from '../pages/admin/AdminBranchesPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';

// Kitchen
import KitchenPage from '../pages/kitchen/KitchenPage';

// Waiter
import WaiterPage from '../pages/waiter/WaiterPage';

function RootRedirect() {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? '/admin/dashboard' : '/kitchen'} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Admin routes */}
      <Route element={<AdminRoute />}>
        <Route element={<Layout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/tables" element={<AdminTablesPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/categories" element={<AdminProductCategoriesPage />} />
          <Route path="/admin/branches" element={<AdminBranchesPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/staff" element={<AdminStaffPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPlaceholder />} />
        </Route>
      </Route>

      {/* Employee routes (kitchen + waiter) */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/kitchen" element={<KitchenPage />} />
          <Route path="/waiter" element={<WaiterPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AdminSettingsPlaceholder() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuración</h1>
      <p className="text-gray-500">Esta sección estará disponible próximamente.</p>
    </div>
  );
}
