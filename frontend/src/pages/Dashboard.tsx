import { useEffect, useState } from "react";
import api from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

interface KPIData {
  total_capacity: number;
  used_capacity: number;
  free_capacity: number;
  utilization_percent: number;
  total_warehouses: number;
  total_zones: number;
  total_bins: number;
  low_stock_alerts: number;
  overloaded_bins: number;
  movement_summary: {
    total_in: number;
    total_out: number;
    net: number;
    period_days: number;
  };
}

interface UtilizationRow {
  warehouse_name: string;
  warehouse_code: string;
  total_capacity: number;
  used_capacity: number;
  free_capacity: number;
  utilization_percent: number;
}

const KPICard = ({
  title, value, sub, color, icon,
}: {
  title: string; value: string | number; sub?: string; color: string; icon: string;
}) => (
  <div className={`rounded-xl p-5 text-white shadow-md ${color} flex items-center gap-4`}>
    <div className="text-4xl">{icon}</div>
    <div>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </div>
  </div>
);

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [utilization, setUtilization] = useState<UtilizationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/dashboard/kpis/"),
      api.get("/api/v1/warehouses/utilization/"),
    ])
      .then(([kpiRes, utilRes]) => {
        setKpis(kpiRes.data);
        setUtilization(utilRes.data);
      })
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." fullScreen />;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!kpis) return null;

  const utilizationColor = (pct: number) =>
    pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-400" : "bg-green-500";

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Warehouse Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Capacity" value={kpis.total_capacity.toLocaleString()}
          sub="units across all bins" color="bg-indigo-600" icon="??" />
        <KPICard title="Used Capacity" value={kpis.used_capacity.toLocaleString()}
          sub={`${kpis.utilization_percent}% utilization`} color="bg-blue-500" icon="??" />
        <KPICard title="Free Capacity" value={kpis.free_capacity.toLocaleString()}
          sub="available space" color="bg-emerald-500" icon="?" />
        <KPICard title="Utilization %" value={`${kpis.utilization_percent}%`}
          sub="overall warehouse fill" color={kpis.utilization_percent >= 90 ? "bg-red-500" : "bg-violet-500"} icon="??" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { title: "Warehouses", value: kpis.total_warehouses, icon: "??" },
          { title: "Zones", value: kpis.total_zones, icon: "???" },
          { title: "Bins", value: kpis.total_bins, icon: "???" },
          { title: "Low Stock Alerts", value: kpis.low_stock_alerts, icon: "??" },
          { title: "Overloaded Bins", value: kpis.overloaded_bins, icon: "??" },
        ].map(card => (
          <div key={card.title} className="bg-white rounded-xl border p-4 shadow-sm text-center">
            <div className="text-3xl mb-1">{card.icon}</div>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Movement Summary */}
      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-700 mb-4">
          Stock Movement — Last {kpis.movement_summary.period_days} Days
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">+{kpis.movement_summary.total_in}</p>
            <p className="text-xs text-gray-500">Stock In</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">-{kpis.movement_summary.total_out}</p>
            <p className="text-xs text-gray-500">Stock Out</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${kpis.movement_summary.net >= 0 ? "text-blue-600" : "text-orange-500"}`}>
              {kpis.movement_summary.net >= 0 ? "+" : ""}{kpis.movement_summary.net}
            </p>
            <p className="text-xs text-gray-500">Net Change</p>
          </div>
        </div>
      </div>

      {/* Per-Warehouse Utilization Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-base font-semibold text-gray-700">Warehouse Utilization Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Warehouse</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Used</th>
                <th className="px-4 py-3 text-right">Free</th>
                <th className="px-4 py-3 text-left">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {utilization.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">No warehouse data found.</td></tr>
              ) : utilization.map((row) => (
                <tr key={row.warehouse_code} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {row.warehouse_name}
                    <span className="ml-2 text-xs text-gray-400">({row.warehouse_code})</span>
                  </td>
                  <td className="px-4 py-3 text-right">{row.total_capacity}</td>
                  <td className="px-4 py-3 text-right">{row.used_capacity}</td>
                  <td className="px-4 py-3 text-right">{row.free_capacity}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${utilizationColor(row.utilization_percent)}`}
                          style={{ width: `${Math.min(row.utilization_percent, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-10 text-right">
                        {row.utilization_percent}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


