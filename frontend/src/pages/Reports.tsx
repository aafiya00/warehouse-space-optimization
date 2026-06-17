import { useEffect, useState } from "react";
import api from "../api/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface UtilizationData { zone: string; used: number; available: number; percent: number; }
interface MovementSummary { movement_type: string; total: number; }

export default function Reports() {
  const [utilization, setUtilization] = useState<UtilizationData[]>([]);
  const [movements, setMovements] = useState<MovementSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/v1/reports/utilization/"),
      api.get("/v1/reports/movement-trends/"),
    ])
      .then(([uRes, mRes]) => {
        setUtilization(uRes.data?.zones || []);
        const trends = mRes.data?.trends || [];
        const inTotal = trends.reduce((s: number, t: any) => s + t.in, 0);
        const outTotal = trends.reduce((s: number, t: any) => s + t.out, 0);
        setMovements([
          { movement_type: "Stock In", total: inTotal },
          { movement_type: "Stock Out", total: outTotal },
        ]);
      })
      .catch(() => { setUtilization([]); setMovements([]); })
      .finally(() => setLoading(false));
  }, []);

  const downloadFile = async (url: string, filename: string) => {
    setExporting(filename);
    try {
      const res = await api.get(url, { responseType: "blob" });
      const href = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(href);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
      </div>

      {/* Export Buttons */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Export Reports</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => downloadFile("/v1/reports/inventory/csv/", "inventory_report.csv")}
            disabled={exporting !== null}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
            {exporting === "inventory_report.csv" ? "? Exporting..." : "?? Inventory CSV"}
          </button>
          <button
            onClick={() => downloadFile("/v1/reports/inventory/excel/", "inventory_report.xlsx")}
            disabled={exporting !== null}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition">
            {exporting === "inventory_report.xlsx" ? "? Exporting..." : "?? Inventory Excel"}
          </button>
          <button
            onClick={() => downloadFile("/v1/reports/movements/csv/", "movements_report.csv")}
            disabled={exporting !== null}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
            {exporting === "movements_report.csv" ? "? Exporting..." : "?? Movements CSV"}
          </button>
        </div>
      </div>

      {/* Warehouse Utilization Bar Chart */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Warehouse Zone Utilization (%)</h2>
        {utilization.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={utilization}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="zone" />
              <YAxis domain={[0, 100]} unit="%" />
              <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
              <Legend />
              <Bar dataKey="percent" name="Utilization %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-gray-400 text-center py-10">No utilization data available yet</div>
        )}
      </div>

      {/* Movement Summary Pie Chart */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Stock Movement Summary</h2>
        {movements.some(m => m.total > 0) ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={movements} cx="50%" cy="50%" outerRadius={100}
  dataKey="total" nameKey="movement_type">

                {movements.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-gray-400 text-center py-10">No movement data available yet</div>
        )}
      </div>

      {/* Utilization Detail Table */}
      {utilization.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Zone Utilization Detail</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  {["Zone", "Used", "Available", "Utilization %"].map(h => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {utilization.map(z => (
                  <tr key={z.zone} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{z.zone}</td>
                    <td className="px-4 py-3">{z.used}</td>
                    <td className="px-4 py-3">{z.available}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${Math.min(z.percent, 100)}%` }} />
                        </div>
                        <span className={z.percent > 80 ? "text-red-600 font-semibold" : "text-gray-700"}>
                          {z.percent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

