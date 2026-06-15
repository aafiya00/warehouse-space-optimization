import { useEffect, useState } from "react";
import api from "../api/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface UtilizationData {
  zone: string;
  used: number;
  available: number;
  percent: number;
}

interface MovementTrend {
  date: string;
  in: number;
  out: number;
}

interface LowStockItem {
  sku: string;
  name: string;
  quantity: number;
  reorder_level: number;
}

export default function AnalyticsDashboard() {
  const [utilization, setUtilization] = useState<UtilizationData[]>([]);
  const [trends, setTrends] = useState<MovementTrend[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/warehouses/utilization/"),
      api.get("/api/v1/inventory/movement-trends/"),
      api.get("/api/v1/inventory/low-stock/"),
    ])
      .then(([utilRes, trendRes, lowRes]) => {
        setUtilization(utilRes.data?.zones || []);
        setTrends(trendRes.data?.trends || []);
        setLowStock(lowRes.data?.results || lowRes.data || []);
      })
      .catch(() => {
        // Gracefully show empty charts if endpoints not yet wired
        setUtilization([]);
        setTrends([]);
        setLowStock([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const categoryData = [
    { name: "Utilization", value: utilization.reduce((s, z) => s + z.percent, 0) / (utilization.length || 1) },
    { name: "Remaining", value: 100 - (utilization.reduce((s, z) => s + z.percent, 0) / (utilization.length || 1)) },
  ];

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Zones", value: utilization.length, color: "bg-indigo-50 text-indigo-700" },
          { label: "Low Stock Items", value: lowStock.length, color: "bg-red-50 text-red-700" },
          { label: "Avg Utilization", value: `${Math.round(categoryData[0].value)}%`, color: "bg-green-50 text-green-700" },
          { label: "Movement Records", value: trends.reduce((s, t) => s + t.in + t.out, 0), color: "bg-amber-50 text-amber-700" },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-xl p-4 ${kpi.color}`}>
            <div className="text-3xl font-bold">{kpi.value}</div>
            <div className="text-sm mt-1 font-medium">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Warehouse Utilization Bar Chart */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Zone Utilization (%)</h2>
        {utilization.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={utilization}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="zone" />
              <YAxis domain={[0, 100]} unit="%" />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Legend />
              <Bar dataKey="percent" name="Utilization %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-gray-400 text-center py-10">No zone data available yet</div>
        )}
      </div>

      {/* Stock Movement Trends Line Chart */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Stock Movement Trends (Last 30 Days)</h2>
        {trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="in" stroke="#10b981" name="Stock In" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="out" stroke="#ef4444" name="Stock Out" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-gray-400 text-center py-10">No movement trend data yet</div>
        )}
      </div>

      {/* Pie + Low Stock side by side */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Overall Utilization</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                dataKey="value" label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Low Stock Alerts</h2>
          {lowStock.length > 0 ? (
            <div className="overflow-y-auto max-h-52 space-y-2">
              {lowStock.map((item) => (
                <div key={item.sku}
                  className="flex justify-between items-center px-3 py-2 bg-red-50 rounded-lg">
                  <div>
                    <span className="font-mono text-sm text-red-700">{item.sku}</span>
                    <p className="text-xs text-gray-500">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-red-600 font-bold">{item.quantity}</span>
                    <p className="text-xs text-gray-400">min {item.reorder_level}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-center py-10">All stock levels healthy ✅</div>
          )}
        </div>
      </div>
    </div>
  );
}