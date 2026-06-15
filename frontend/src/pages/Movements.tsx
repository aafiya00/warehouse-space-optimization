import { useState, useEffect } from "react";
import api from "../api/client";

interface Movement {
  id: number;
  product: number;
  product_name?: string;
  movement_type: string;
  quantity: number;
  bin: number | null;
  notes: string;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
}

const TYPE_COLORS: Record<string, string> = {
  in: "bg-green-100 text-green-700",
  out: "bg-red-100 text-red-600",
  transfer: "bg-blue-100 text-blue-700",
  adjustment: "bg-yellow-100 text-yellow-700",
};

export default function Movements() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ product: "", movement_type: "in", quantity: "1", notes: "" });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, pRes] = await Promise.all([
        api.get("/inventory/movements/"),
        api.get("/inventory/products/"),
      ]);
      setMovements(mRes.data.results ?? mRes.data);
      setProducts(pRes.data.results ?? pRes.data);
    } catch {
      setError("Failed to load movements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    try {
      await api.post("/inventory/movements/", {
        product: Number(form.product),
        movement_type: form.movement_type,
        quantity: Number(form.quantity),
        notes: form.notes,
      });
      setShowForm(false);
      setForm({ product: "", movement_type: "in", quantity: "1", notes: "" });
      fetchData();
    } catch { alert("Failed to record movement."); }
  };

  const filtered = movements.filter(m => {
    const prod = products.find(p => p.id === m.product);
    const matchSearch = !search ||
      prod?.name.toLowerCase().includes(search.toLowerCase()) ||
      prod?.sku.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || m.movement_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock Movements</h1>
          <p className="text-sm text-gray-500 mt-1">Track all inventory in/out/transfer events</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Record Movement
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input type="text" placeholder="Search by product name or SKU..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Types</option>
          <option value="in">In</option>
          <option value="out">Out</option>
          <option value="transfer">Transfer</option>
          <option value="adjustment">Adjustment</option>
        </select>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && (
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="w-full text-sm bg-white">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Quantity</th>
                <th className="px-4 py-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No movements found.</td></tr>
              )}
              {filtered.map(m => {
                const prod = products.find(p => p.id === m.product);
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(m.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{prod?.name ?? `Product #${m.product}`}</div>
                      {prod && <div className="text-xs text-gray-400">{prod.sku}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${TYPE_COLORS[m.movement_type] ?? "bg-gray-100 text-gray-600"}`}>
                        {m.movement_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{m.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{m.notes || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Record Stock Movement</h2>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Product</label>
              <select value={form.product} onChange={e => setForm({ ...form, product: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Type</label>
              <select value={form.movement_type} onChange={e => setForm({ ...form, movement_type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="in">In</option>
                <option value="out">Out</option>
                <option value="transfer">Transfer</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Quantity</label>
              <input type="number" min="1" value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Save</button>
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
