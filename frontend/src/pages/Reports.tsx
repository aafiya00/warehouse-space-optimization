/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import api from "../api/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
type TabType = "utilization" | "inventory" | "movements";
const TABS: { key: TabType; label: string }[] = [
  { key: "utilization", label: "Space Utilization" },
  { key: "inventory",   label: "Inventory Levels"  },
  { key: "movements",   label: "Stock Movements"   },
];

export default function Reports() {
  const [tab, setTab]                 = useState<TabType>("utilization");
  const [data, setData]               = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [loaded, setLoaded]           = useState(false);
  const [warehouseId, setWarehouseId] = useState("");

  const reset = (newTab: TabType) => { setTab(newTab); setLoaded(false); setData([]); };

  const handleLoad = async () => {
    setLoaded(false); setData([]); setLoading(true);
    try {
      if (tab === "utilization") {
        const params = warehouseId ? { warehouse_id: warehouseId } : {};
        const res = await api.get("/warehouses/utilization-report/", { params });
        setData(res.data.report ?? []);
      } else if (tab === "inventory") {
        const res = await api.get("/inventory/items/");
        const items: any[] = res.data.results ?? res.data;
        const g: Record<string, number> = {};
        items.forEach((item) => { const k = item.product_name ?? String(item.product); g[k] = (g[k] ?? 0) + Number(item.quantity); });
        setData(Object.entries(g).map(([name, quantity]) => ({ name, quantity })));
      } else {
        const res = await api.get("/inventory/movements/");
        const moves: any[] = res.data.results ?? res.data;
        const g: Record<string, number> = { in: 0, out: 0, transfer: 0, adjustment: 0 };
        moves.forEach((m) => { g[m.movement_type] = (g[m.movement_type] ?? 0) + Math.abs(Number(m.quantity)); });
        setData(Object.entries(g).map(([type, count]) => ({ type, count })));
      }
      setLoaded(true);
    } catch { alert("Failed to load report."); }
    setLoading(false);
  };

  const exportCSV = () => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(","), ...data.map((r) => keys.map((k) => r[k]).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${tab}_report.csv`; a.click();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports and Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Visualize warehouse data and export reports</p>
        </div>
        {loaded && data.length > 0 && (
          <button onClick={exportCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">Export CSV</button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => reset(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-6 items-center">
        {tab === "utilization" && (
          <input type="number" placeholder="Warehouse ID (optional)" value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
        )}
        <button onClick={handleLoad} disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
          {loading ? "Loading..." : "Generate Report"}
        </button>
      </div>

      {loaded && data.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow text-gray-400">No data available.</div>
      )}

      {loaded && data.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          {tab === "utilization" && (
            <>
              <h2 className="font-semibold text-gray-700 mb-4">Space Utilization by Zone</h2>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="zone" angle={-30} textAnchor="end" tick={{ fontSize: 12 }} />
                  <YAxis unit="%" domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="utilization_percent" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Utilization %" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>{["Warehouse","Zone","Bins","Used","Capacity","Utilization"].map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr>
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
                          <span className={`font-semibold ${Number(row.utilization_percent) > 80 ? "text-red-500" : Number(row.utilization_percent) > 50 ? "text-yellow-500" : "text-green-600"}`}>
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

          {tab === "inventory" && (
            <>
              <h2 className="font-semibold text-gray-700 mb-4">Stock Quantity by Product</h2>
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={data} dataKey="quantity" nameKey="name" cx="50%" cy="50%" outerRadius={110}>
                      {data.map((_e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full md:w-64 shrink-0">
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-gray-500 uppercase border-b"><th className="pb-1 text-left">Product</th><th className="pb-1 text-right">Qty</th></tr></thead>
                    <tbody>{data.map((row, i) => (
                      <tr key={i}><td className="py-1.5 flex items-center gap-2"><span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />{row.name}</td><td className="py-1.5 text-right font-semibold">{row.quantity}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </>
          )}

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
                    {data.map((_e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
