import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Warehouse, Boxes, Layers, Archive,
  Package, Tag, ClipboardList, ArrowLeftRight, LogOut
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/warehouses', label: 'Warehouses', icon: Warehouse },
  { to: '/zones', label: 'Zones', icon: Layers },
  { to: '/racks', label: 'Racks', icon: Boxes },
  { to: '/bins', label: 'Bins', icon: Archive },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/inventory', label: 'Inventory', icon: ClipboardList },
  { to: '/movements', label: 'Stock Movements', icon: ArrowLeftRight },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-60 bg-slate-900 text-slate-200 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-700">
          <h1 className="text-lg font-bold text-white leading-tight">Warehouse</h1>
          <p className="text-xs text-slate-400">Space Optimization System</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white border-r-2 border-blue-500'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-700 p-4">
          <p className="text-xs text-slate-400">Signed in as</p>
          <p className="text-sm font-medium text-white truncate">{user?.username}</p>
          <p className="text-xs text-slate-500 capitalize mb-3">{user?.role}</p>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-red-600/90 hover:bg-red-600 text-white text-sm py-2 rounded transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}