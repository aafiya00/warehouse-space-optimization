import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { to: "/", label: "Dashboard", icon: "🏠" },
  { to: "/warehouses", label: "Warehouses", icon: "🏭" },
  { to: "/zones", label: "Zones", icon: "📍" },
  { to: "/racks", label: "Racks", icon: "🗄️" },
  { to: "/bins", label: "Bins", icon: "📦" },
  { to: "/products", label: "Products", icon: "🏷️" },
  { to: "/suppliers", label: "Suppliers", icon: "🚚" },
  { to: "/inventory", label: "Inventory", icon: "📋" },
  { to: "/movements", label: "Movements", icon: "🔄" },
  { to: "/approvals", label: "Approvals", icon: "✅" },
  { to: "/notifications", label: "Notifications", icon: "🔔" },
  { to: "/reports", label: "Reports", icon: "📊" },
  { to: "/analytics", label: "Analytics", icon: "📈" },
  { to: "/ai", label: "AI Insights", icon: "🤖" },
];

export default function Layout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  const SidebarContent = () => (
    <>
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <span className="text-lg font-bold text-blue-700">🏬 WarehouseOS</span>
        <button className="md:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(false)}>✕</button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map(link => {
          const active = location.pathname === link.to;
          return (
            <Link key={link.to} to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
        {user?.role === "admin" && (
          <Link to="/users" onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${location.pathname === "/users" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            <span>👥</span><span>User Management</span>
          </Link>
        )}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <Link to="/profile" onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          👤 My Profile
        </Link>
        <Link to="/change-password" onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          🔑 Change Password
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 text-left">
          🚪 Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-200 flex flex-col shadow-sm transform transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <SidebarContent />
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-blue-600 text-xl">☰</button>
          <span className="text-base font-bold text-blue-700">🏬 WarehouseOS</span>
        </div>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}