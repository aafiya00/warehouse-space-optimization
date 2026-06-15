import { useState, useEffect } from "react";
import axios from "axios";

interface Product { id: number; name: string; sku: string; }
interface BinResult { bin_code: string; rack: string; zone: string; warehouse: string; capacity: number; available_space: number; current_utilization_percent: number; utilization_after_placement_percent: number; ai_score?: number; reasons?: string[]; }
interface Prediction { product_name: string; sku: string; current_stock: number; reorder_level: number; daily_consumption_rate: number; days_of_stock_remaining: number | string; needs_reorder: boolean; urgency: string; }

const BASE = "http://localhost:8000/api/warehouses";

export default function AIRecommendation() {
  const [tab, setTab] = useState<"bin" | "reorder" | "forecast">("bin");
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [binResult, setBinResult] = useState<any>(null);
  const [reorders, setReorders] = useState<Prediction[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const token = localStorage.getItem("access");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get("http://localhost:8000/api/inventory/products/", { headers })
      .then(r => setProducts(r.data.results ?? r.data));
  }, []);

  const runBinRecommend = async () => {
    if (!productId || !quantity) return setMsg("Select a product and enter quantity.");
    setLoading(true); setMsg(""); setBinResult(null);
    try {
      const r = await axios.get(`${BASE}/ai-recommend/`, { headers, params: { product_id: productId, quantity } });
      setBinResult(r.data);
    } catch { setMsg("Error fetching recommendation."); }
    setLoading(false);
  };

  const runReorder = async () => {
    setLoading(true); setMsg(""); setReorders([]);
    try {
      const r = await axios.get(`${BASE}/reorder-predictions/`, { headers });
      setReorders(r.data.predictions);
    } catch { setMsg("Error fetching predictions."); }
    setLoading(false);
  };

  const runForecast = async () => {
    if (!productId) return setMsg("Select a product first.");
    setLoading(true); setMsg(""); setForecast(null);
    try {
      const r = await axios.get(`${BASE}/demand-forecast/`, { headers, params: { product_id: productId } });
      setForecast(r.data);
    } catch { setMsg("Error fetching forecast."); }
    setLoading(false);
  };

  const urgencyColor: Record<string, string> = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    ok: "bg-green-100 text-green-700",
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">AI Recommendations</h1>
      <p className="text-gray-500 mb-6">Smart bin placement, reorder predictions, and demand forecasting powered by AI.</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(["bin", "reorder", "forecast"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition capitalize ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t === "bin" ? "🤖 Bin Recommendation" : t === "reorder" ? "📦 Reorder Predictions" : "📈 Demand Forecast"}
          </button>
        ))}
      </div>

      {msg && <p className="text-red-500 text-sm mb-4">{msg}</p>}

      {/* BIN TAB */}
      {tab === "bin" && (
        <div>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <select value={productId} onChange={e => setProductId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Select Product —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.sku} – {p.name}</option>)}
            </select>
            <input type="number" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)}
              className="w-36 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={runBinRecommend} disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Thinking..." : "Get Recommendation"}
            </button>
          </div>

          {binResult && (
            <div>
              <h2 className="font-semibold text-gray-700 mb-3">✅ Recommended Bin</h2>
              <BinCard bin={binResult.recommended} highlight />
              {binResult.alternatives?.length > 0 && (
                <>
                  <h2 className="font-semibold text-gray-700 mt-6 mb-3">🔄 Alternatives</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {binResult.alternatives.map((b: BinResult, i: number) => <BinCard key={i} bin={b} />)}
                  </div>
                </>
              )}
              <p className="text-xs text-gray-400 mt-4">Checked {binResult.total_bins_checked} bins · {binResult.eligible_bins} eligible · AI-powered ✨</p>
            </div>
          )}
        </div>
      )}

      {/* REORDER TAB */}
      {tab === "reorder" && (
        <div>
          <button onClick={runReorder} disabled={loading}
            className="mb-6 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Analyzing..." : "Run Reorder Analysis"}
          </button>
          {reorders.length > 0 && (
            <div className="overflow-x-auto rounded-xl shadow">
              <table className="w-full text-sm bg-white">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                  <tr>
                    {["SKU", "Product", "Stock", "Reorder At", "Daily Rate", "Days Left", "Urgency"].map(h => (
                      <th key={h} className="px-4 py-3 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reorders.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-blue-600">{p.sku}</td>
                      <td className="px-4 py-3">{p.product_name}</td>
                      <td className="px-4 py-3">{p.current_stock}</td>
                      <td className="px-4 py-3">{p.reorder_level}</td>
                      <td className="px-4 py-3">{p.daily_consumption_rate}/day</td>
                      <td className="px-4 py-3">{p.days_of_stock_remaining}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${urgencyColor[p.urgency] ?? "bg-gray-100"}`}>
                          {p.urgency.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FORECAST TAB */}
      {tab === "forecast" && (
        <div>
          <div className="flex gap-4 mb-6">
            <select value={productId} onChange={e => setProductId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Select Product —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.sku} – {p.name}</option>)}
            </select>
            <button onClick={runForecast} disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Forecasting..." : "Forecast Demand"}
            </button>
          </div>

          {forecast && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold text-gray-700 mb-4">📈 Demand Forecast — {forecast.sku}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {forecast.weekly_demand_last_4_weeks.map((v: number, i: number) => (
                  <div key={i} className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Week {i + 1} ago</p>
                    <p className="text-2xl font-bold text-blue-600">{v}</p>
                    <p className="text-xs text-gray-400">units</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Avg Weekly</p>
                  <p className="text-xl font-bold text-gray-800">{forecast.average_weekly_demand}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Projected Monthly</p>
                  <p className="text-xl font-bold text-blue-600">{forecast.projected_monthly_demand}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BinCard({ bin, highlight = false }: { bin: BinResult; highlight?: boolean }) {
  const util = bin.current_utilization_percent ?? 0;
  const barColor = util > 80 ? "bg-red-400" : util > 50 ? "bg-yellow-400" : "bg-green-400";
  return (
    <div className={`rounded-xl p-4 border-2 ${highlight ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"} shadow`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono font-bold text-lg text-gray-800">Bin {bin.bin_code}</span>
        {bin.ai_score !== undefined && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">Score: {bin.ai_score}</span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-3">{bin.warehouse} › {bin.zone} › {bin.rack}</p>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>Utilization</span>
        <span>{util}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${util}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Available: {bin.available_space}</span>
        <span>Capacity: {bin.capacity}</span>
      </div>
      {bin.reasons && bin.reasons.length > 0 && (
        <ul className="mt-3 space-y-1">
          {bin.reasons.map((r, i) => <li key={i} className="text-xs text-green-700 flex items-center gap-1">✓ {r}</li>)}
        </ul>
      )}
    </div>
  );
}