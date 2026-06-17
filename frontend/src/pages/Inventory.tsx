import { useState, useEffect } from "react";
import axios from "axios";

interface InventoryItem { id: number; product: number; product_name?: string; bin: number; bin_code?: string; quantity: number; }
interface Product { id: number; name: string; sku: string; }
interface Bin { id: number; code: string; rack: number; }

const INV_API = "https://warehouse-space-optimization.onrender.com/api/inventory/items/";
const PROD_API = "https://warehouse-space-optimization.onrender.com/api/inventory/products/";
const BIN_API = "https://warehouse-space-optimization.onrender.com/api/warehouses/bins/";
const MOVE_API = "https://warehouse-space-optimization.onrender.com/api/inventory/movements/";

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showMove, setShowMove] = useState(false);
  const [moveForm, setMoveForm] = useState({ product: "", bin: "", movement_type: "in", quantity: "1", note: "" });

  const token = localStorage.getItem("access");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    setLoading(true);
    const [inv, prod, bin] = await Promise.all([
      axios.get(INV_API, { headers }),
      axios.get(PROD_API, { headers }),
      axios.get(BIN_API, { headers }),
    ]);
    setItems(inv.data.results ?? inv.data);
    setProducts(prod.data.results ?? prod.data);
    setBins(bin.data.results ?? bin.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const getProductName = (id: number) => {
    const p = products.find(p => p.id === id);
    return p ? `${p.sku} – ${p.name}` : `Product #${id}`;
  };

  const getBinCode = (id: number) => bins.find(b => b.id === id)?.code ?? `Bin #${id}`;

  const handleMove = async () => {
    try {
      await axios.post(MOVE_API, {
        product: parseInt(moveForm.product),
        bin: parseInt(moveForm.bin),
        movement_type: moveForm.movement_type,
        quantity: parseInt(moveForm.quantity),
        note: moveForm.note,
      }, { headers });
      setShowMove(false);
      fetchAll();
    } catch { alert("Movement failed. Check all fields."); }
  };

  const filtered = items.filter(item => {
    const pname = getProductName(item.product).toLowerCase();
    return pname.includes(search.toLowerCase());
  });



  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
        <button onClick={() => setShowMove(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Stock Movement
        </button>
      </div>

      <input type="text" placeholder="Search by product name or SKU..." value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />

      {loading ? <p className="text-gray-400">Loading...</p> : (
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="w-full text-sm bg-white">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                {["Product", "Bin", "Quantity", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">No inventory items found.</td></tr>}
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{getProductName(item.product)}</td>
                  <td className="px-4 py-3 font-mono text-gray-500">{getBinCode(item.bin)}</td>
                  <td className="px-4 py-3 font-semibold">{item.quantity}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.quantity === 0 ? "bg-red-100 text-red-600" : item.quantity < 10 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                      {item.quantity === 0 ? "Out of Stock" : item.quantity < 10 ? "Low Stock" : "In Stock"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showMove && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Stock Movement</h2>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Product</label>
              <select value={moveForm.product} onChange={e => setMoveForm({ ...moveForm, product: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="">— Select —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.sku} – {p.name}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Bin</label>
              <select value={moveForm.bin} onChange={e => setMoveForm({ ...moveForm, bin: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="">— Select —</option>
                {bins.map(b => <option key={b.id} value={b.id}>Bin {b.code}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Movement Type</label>
              <select value={moveForm.movement_type} onChange={e => setMoveForm({ ...moveForm, movement_type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2">
                {["in", "out", "transfer", "adjustment"].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Quantity</label>
              <input type="number" value={moveForm.quantity} onChange={e => setMoveForm({ ...moveForm, quantity: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Note (optional)</label>
              <input type="text" value={moveForm.note} onChange={e => setMoveForm({ ...moveForm, note: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleMove} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Submit</button>
              <button onClick={() => setShowMove(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
