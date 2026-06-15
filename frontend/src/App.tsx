import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import Warehouses from "./pages/Warehouses";
import Zones from "./pages/Zones";
import Racks from "./pages/Racks";
import Bins from "./pages/Bins";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Movements from "./pages/Movements";
import Approvals from "./pages/Approvals";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import AIRecommendation from "./pages/AIRecommendation";

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="warehouses" element={<Warehouses />} />
            <Route path="zones" element={<Zones />} />
            <Route path="racks" element={<Racks />} />
            <Route path="bins" element={<Bins />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="movements" element={<Movements />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="reports" element={<Reports />} />
            <Route path="ai" element={<AIRecommendation />} />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
