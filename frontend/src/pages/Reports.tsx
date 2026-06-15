import { useState } from "react";
import api from "../api/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function Reports() {
  const [tab, setTab] = useState<"utilization" | "inventory" | "movements">("utilization");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [warehouseId, setWarehouseId] = useState("");

  const loadUtilization = async () => {
    setLoading(true);
    try {
      const params = warehouseId ? { warehouse_id: warehouseId } : {};
      const res = await api.get("/warehouses/utilization-report/", { params });
      setData(res.data.report ?? []);
      setLoaded(true);
    } catch { alert("Failed to load utilization report."); }
    setLoading(false);
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get("/inventory/items/");
      const items = res.data.results ?? res.data;
      // Group by product
      const grouped: Record<string, number> = {};
      items.forEach((item: any) => {
        const key = item.product_name ?? `Product #${item.product}`;
        grouped[key] = (grouped[key] ?? 0) + item.quantity;
      });
      setData(Object.entries(grouped).map(([name, quantity]) => ({ name, quantity })));
      setLoaded(true);
    } catch { alert("Failed to load inventory report."); }
    setLoading(false);
  };

  const loadMovements = async () => {
    setLoading(true);
    try {
      const res = await api.get("/inventory/movements/");
      const moves = res.data.results ?? res.data;
      const grouped: Record<string, number> = { in: 0, out: 0, transfer: 0, adjustment: 0 };
      moves.forEach((m: any) => { grouped[m.movement_type] = (grouped[m.movement_type] ?? 0) + Math.abs(m.quantity); });
      setData(Object.entries(grouped).map(([type, count]) => ({ type, count })));
      setLoaded(true);
    } catch { alert("Failed to load movements report."); }
    setLoading(false);
  };

  const handleLoad = () => {
    setLoaded(false);
    setData([]);
    if (tab === "utilization") loadUtilization();
    else if (tab === "inventory") loadInventory();
    else loadMovements();
  };

  const exportCSV = () => {
    if (data.length === 0) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(","), ...data.map(row => keys.map(k => row[k]).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tab}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Visualize warehouse data and export reports</p>
        </div>
        {loaded && data.length > 0 && (
          <button onClick={exportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm">
            ⬇ Export CSV
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: "utilization", label: "📊 Space Utilization" },
          { key: "inventory", label: "📦 Inventory Levels" },
          { key: "movements", label: "🔄 Stock Movements" },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key as any); setLoaded(false); setData([]); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-6 items-center">
        {tab === "utilization" && (
          <input type="number" placeholder="Warehouse ID (optional)"
            value={warehouseId} onChange={e => setWarehouseId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
        )}
        <button onClick={handleLoad} disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
          {loading ? "Loading..." : "Generate Report"}
        </button>
      </div>

      {/* Charts */}
      {loaded && data.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow text-gray-400">
          No data available. Add warehouse data first.
        </div>
      )}

      {loaded && data.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          {/* Utilization Bar Chart */}
          {tab === "utilization" && (
            <>
              <h2 className="font-semibold text-gray-700 mb-4">Space Utilization by Zone</h2>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="zone" angle={-30} textAnchor="end" tick={{ fontSize: 12 }} />
                  <YAxis unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="utilization_percent" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Utilization" />
                </BarChart>
              </ResponsiveContainer>
              {/* Summary Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      {["Warehouse", "Zone", "Bins", "Used", "Capacity", "Utilization"].map(h => (
                        <th key={h} className="px-3 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{row.warehouse}</td>
                        <td className="px-3 py-2">{row.zone}</td>
                        <td className="px-3 py-2">{row.bin_count}</td>
                        <td className="px-3 py-2">{row.total_used}</td>
                        <td className="px-3 py-2">{row.total_capacity}</td>
                        <td className="px-3 py-2">
                          <span className={`font-semibold ${row.utilization_percent > 80 ? "text-red-500" : row.utilization_percent > 50 ? "text-yellow-500" : "text-green-600"}`}>
                            {row.utilization_percent}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Inventory Pie Chart */}
          {tab === "inventory" && (
            <>
              <h2 className="font-semibold text-gray-700 mb-4">Stock Quantity by Product</h2>
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={data} dataKey="quantity" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full md:w-64 shrink-0">
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-gray-500 uppercase border-b"><th className="pb-1 text-left">Product</th><th className="pb-1 text-right">Qty</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.map((row, i) => (
                        <tr key={i}><td className="py-1.5 flex items-center gap-2"><span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />{row.name}</td><td className="py-1.5 text-right font-semibold">{row.quantity}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Movements Bar Chart */}
          {tab === "movements" && (
            <>
              <h2 className="font-semibold text-gray-700 mb-4">Stock Movement Summary</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Quantity">
                    {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      )}
    </div>
  );
}