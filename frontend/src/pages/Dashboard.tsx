import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

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
  code: string;
  total_capacity: number;
  used_capacity: number;
  utilization_percent: number;
}

interface LowStock {
  product: string;
  sku: string;
  current_stock: number;
  reorder_level: number;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [utilization, setUtilization] = useState<Utilization[]>([]);
  const [lowStock, setLowStock] = useState<LowStock[]>([]);
  const { user, logout } = useAuth();

  useEffect(() => {
    api.get('/warehouses/dashboard/summary/').then((res) => setSummary(res.data));
    api.get('/warehouses/dashboard/utilization/').then((res) => setUtilization(res.data));
    api.get('/warehouses/dashboard/low-stock/').then((res) => setLowStock(res.data));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Warehouse Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
          <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Logout
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="Warehouses" value={summary.total_warehouses} />
          <StatCard label="Zones" value={summary.total_zones} />
          <StatCard label="Racks" value={summary.total_racks} />
          <StatCard label="Bins" value={summary.total_bins} />
          <StatCard label="Products" value={summary.total_products} />
          <StatCard label="Total Stock" value={summary.total_stock_items} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Warehouse Utilization</h2>
          {utilization.map((u) => (
            <div key={u.code} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{u.warehouse} ({u.code})</span>
                <span>{u.utilization_percent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${Math.min(u.utilization_percent, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {u.used_capacity} / {u.total_capacity} used
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Low Stock Alerts</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-500">No low stock items</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-1">Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Reorder Level</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item) => (
                  <tr key={item.sku} className="border-b">
                    <td className="py-1">{item.product}</td>
                    <td>{item.sku}</td>
                    <td className="text-red-500 font-semibold">{item.current_stock}</td>
                    <td>{item.reorder_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}