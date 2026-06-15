import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { to: "/", label: "Dashboard", icon: "🏠" },
  { to: "/warehouses", label: "Warehouses", icon: "🏭" },
  { to: "/products", label: "Products", icon: "📦" },
  { to: "/inventory", label: "Inventory", icon: "📋" },
  { to: "/ai", label: "AI Insights", icon: "🤖" },
  { to: "/approvals", label: "Approvals", icon: "✅" },
  { to: "/notifications", label: "Notifications", icon: "🔔" },
  { to: "/reports", label: "Reports", icon: "📊" },
];
export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100">
          <span className="text-lg font-bold text-blue-700">🏬 WarehouseOS</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(link => {
            const active = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <Link to="/change-password"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
            🔑 Change Password
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 text-left">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}