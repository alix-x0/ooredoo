import { Routes, Route, Navigate } from "react-router-dom";
import { ACCESS_TOKEN, USER_ROLE } from "@/constants";
import Login from "@/pages/Login";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminDashboard from "@/pages/AdminDashboard";
import WarehouseDashboard from "@/pages/WarehouseDashboard";
import UserManagement from "@/pages/UserManagement";
import GiftManagement from "@/pages/GiftManagement";
import WarehouseManagement from "@/pages/WarehouseManagement";
import WarehouseInventory from "@/pages/WarehouseInventory";
import WarehouseDispatches from "@/pages/WarehouseDispatches";

// Helper components / stubs
function ScrollToTop() {
  return null;
}

function DashboardRedirect() {
  const role = localStorage.getItem(USER_ROLE);
  if (role === "ADMIN") return <Navigate to="/admin" />;
  if (role === "WAREHOUSE") return <Navigate to="/warehouse" />;
  return <Navigate to="/login" />;
}

// Route Guards
function ProtectedRoute({ children }) {
  const token = localStorage.getItem(ACCESS_TOKEN);
  return token ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem(ACCESS_TOKEN);
  const role = localStorage.getItem(USER_ROLE);
  return token && role === "ADMIN" ? children : <Navigate to="/login" />;
}

function WarehouseRoute({ children }) {
  const token = localStorage.getItem(ACCESS_TOKEN);
  const role = localStorage.getItem(USER_ROLE);
  return token && role === "WAREHOUSE" ? children : <Navigate to="/login" />;
}

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />

        {/* Dashboard Router — dispatches by role */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />

        {/* Admin Portal */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <DashboardLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="gifts" element={<GiftManagement />} />
          <Route path="warehouses" element={<WarehouseManagement />} />
          <Route path="settings" element={<AdminDashboard />} />
        </Route>

        {/* Warehouse Portal */}
        <Route
          path="/warehouse"
          element={
            <WarehouseRoute>
              <DashboardLayout />
            </WarehouseRoute>
          }
        >
          <Route index element={<WarehouseDashboard />} />
          <Route path="inventory" element={<WarehouseInventory />} />
          <Route path="dispatches" element={<WarehouseDispatches />} />
          <Route path="settings" element={<WarehouseDashboard />} />
        </Route>

        {/* Catch-all → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
