import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Summary {
  total_warehouses: number;
  total_zones: number;
  total_racks: number;
  total_bins: number;
  total_products: number;
  total_stock_items: number;
}

interface Utilization {
  warehouse: string;
  zone: string;
  total_capacity: number;
  total_used: number;
  utilization_percent: number;
  bin_count: number;
}

interface LowStock {
  product: string;
  sku: string;
  current_stock: number;
  reorder_level: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [utilization, setUtilization] = useState<Utilization[]>([]);
  const [lowStock, setLowStock] = useState<LowStock[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, u, l] = await Promise.all([
          api.get("/warehouses/dashboard/summary/"),
          api.get("/warehouses/dashboard/utilization/"),
          api.get("/warehouses/dashboard/low-stock/"),
        ]);
        setSummary(s.data);
        // utilization endpoint returns array or object with report key
        setUtilization(Array.isArray(u.data) ? u.data : u.data.report ?? []);
        setLowStock(Array.isArray(l.data) ? l.data : l.data.low_stock ?? []);
      } catch (err: any) {
        setError("Failed to load dashboard data. Is the backend running?");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-spin">⚙️</div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, <span className="font-medium text-blue-600">{user?.username}</span></p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Stat Cards */}
      {summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard label="Warehouses" value={summary.total_warehouses} icon="🏭" color="bg-blue-50 text-blue-700" />
          <StatCard label="Zones" value={summary.total_zones} icon="📍" color="bg-purple-50 text-purple-700" />
          <StatCard label="Racks" value={summary.total_racks} icon="🗄️" color="bg-yellow-50 text-yellow-700" />
          <StatCard label="Bins" value={summary.total_bins} icon="📦" color="bg-green-50 text-green-700" />
          <StatCard label="Products" value={summary.total_products} icon="🏷️" color="bg-pink-50 text-pink-700" />
          <StatCard label="Stock Items" value={summary.total_stock_items} icon="📊" color="bg-orange-50 text-orange-700" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-24" />
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Utilization */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">📊 Warehouse Utilization</h2>
          {utilization.length === 0 ? (
            <p className="text-sm text-gray-400">No utilization data yet. Add warehouses and inventory.</p>
          ) : (
            <div className="space-y-4">
              {utilization.map((u, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span className="font-medium">{u.warehouse} › {u.zone}</span>
                    <span className={`font-semibold ${u.utilization_percent > 80 ? "text-red-500" : u.utilization_percent > 50 ? "text-yellow-500" : "text-green-600"}`}>
                      {u.utilization_percent}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${u.utilization_percent > 80 ? "bg-red-400" : u.utilization_percent > 50 ? "bg-yellow-400" : "bg-green-400"}`}
                      style={{ width: `${Math.min(u.utilization_percent, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{u.total_used} / {u.total_capacity} units · {u.bin_count} bins</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">⚠️ Low Stock Alerts</h2>
          {lowStock.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm text-gray-400">All stock levels are healthy.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b">
                    <th className="pb-2 text-left">Product</th>
                    <th className="pb-2 text-left">SKU</th>
                    <th className="pb-2 text-right">Stock</th>
                    <th className="pb-2 text-right">Min</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lowStock.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2 font-medium">{item.product}</td>
                      <td className="py-2 font-mono text-gray-400 text-xs">{item.sku}</td>
                      <td className="py-2 text-right font-bold text-red-500">{item.current_stock}</td>
                      <td className="py-2 text-right text-gray-500">{item.reorder_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Manage Warehouses", icon: "🏭", href: "/warehouses" },
          { label: "Products", icon: "🏷️", href: "/products" },
          { label: "Inventory", icon: "📋", href: "/inventory" },
          { label: "AI Insights", icon: "🤖", href: "/ai" },
        ].map(link => (
          <a key={link.href} href={link.href}
            className="bg-white rounded-xl shadow p-4 flex items-center gap-3 hover:shadow-md transition hover:bg-blue-50 group">
            <span className="text-2xl">{link.icon}</span>
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string; }) {
  return (
    <div className={`${color} rounded-xl p-4 text-center`}>
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-1 opacity-80">{label}</p>
    </div>
  );
}