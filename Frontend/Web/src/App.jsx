import { Routes, Route, Navigate } from "react-router-dom";
import { ACCESS_TOKEN, USER_ROLE } from "@/constants";
import Login from "@/pages/Login";

// Helper components / stubs
function ScrollToTop() {
  return null;
}

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 p-8">
      <h1 className="text-4xl font-extrabold tracking-tight mb-4">Ooredoo Management System</h1>
      <p className="text-lg text-slate-600 mb-6">Warehouse, Employee, and Admin Framework Portal</p>
      <div className="flex space-x-4">
        <a href="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg transition shadow-sm">Login</a>
        <a href="/register" className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-5 rounded-lg transition shadow-sm">Register</a>
      </div>
    </div>
  );
}

function Register() {
  return <Login />;
}

function DashboardRedirect() {
  const role = localStorage.getItem(USER_ROLE);
  if (role === "ADMIN") return <Navigate to="/admin" />;
  if (role === "WAREHOUSE") return <Navigate to="/warehouse" />;
  if (role === "EMPLOYEE") return <Navigate to="/employee" />;
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
  return token && role === "ADMIN" ? children : <Navigate to="/dashboard" />;
}

function WarehouseRoute({ children }) {
  const token = localStorage.getItem(ACCESS_TOKEN);
  const role = localStorage.getItem(USER_ROLE);
  return token && role === "WAREHOUSE" ? children : <Navigate to="/dashboard" />;
}

function EmployeeRoute({ children }) {
  const token = localStorage.getItem(ACCESS_TOKEN);
  const role = localStorage.getItem(USER_ROLE);
  return token && role === "EMPLOYEE" ? children : <Navigate to="/dashboard" />;
}

// Dashboard Page Stubs
function AdminDashboard() { return <div className="p-8"><h1 className="text-2xl font-bold">Admin Dashboard</h1></div>; }
function WarehouseDashboard() { return <div className="p-8"><h1 className="text-2xl font-bold">Warehouse Dashboard</h1></div>; }
function EmployeeDashboard() { return <div className="p-8"><h1 className="text-2xl font-bold">Employee Dashboard</h1></div>; }

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />

        {/* Dashboard Router */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/warehouse/*"
          element={
            <WarehouseRoute>
              <WarehouseDashboard />
            </WarehouseRoute>
          }
        />
        <Route
          path="/employee/*"
          element={
            <EmployeeRoute>
              <EmployeeDashboard />
            </EmployeeRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
