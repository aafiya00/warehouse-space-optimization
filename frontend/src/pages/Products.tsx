import { useState, useEffect } from "react";
import axios from "axios";

interface Category { id: number; name: string; }
interface Product { id: number; name: string; sku: string; category: number | null; description: string; unit_price: string; reorder_level: number; }

const PRODUCT_API = "http://localhost:8000/api/inventory/products/";
const CATEGORY_API = "http://localhost:8000/api/inventory/categories/";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", sku: "", category: "", description: "", unit_price: "0", reorder_level: "10" });

  const token = localStorage.getItem("access");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    setLoading(true);
    const [p, c] = await Promise.all([
      axios.get(PRODUCT_API, { headers }),
      axios.get(CATEGORY_API, { headers }),
    ]);
    setProducts(p.data.results ?? p.data);
    setCategories(c.data.results ?? c.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: "", sku: "", category: "", description: "", unit_price: "0", reorder_level: "10" });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditItem(p);
    setForm({ name: p.name, sku: p.sku, category: String(p.category ?? ""), description: p.description, unit_price: p.unit_price, reorder_level: String(p.reorder_level) });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    const payload = { ...form, category: form.category || null, reorder_level: parseInt(form.reorder_level) };
    try {
      if (editItem) await axios.put(`${PRODUCT_API}${editItem.id}/`, payload, { headers });
      else await axios.post(PRODUCT_API, payload, { headers });
      setShowForm(false);
      fetchAll();
    } catch { alert("Save failed. Check all fields."); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    await axios.delete(`${PRODUCT_API}${id}/`, { headers });
    fetchAll();
  };

  const getCatName = (id: number | null) => categories.find(c => c.id === id)?.name ?? "—";

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">+ Add Product</button>
      </div>

      <input type="text" placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />

      {loading ? <p className="text-gray-400">Loading...</p> : (
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="w-full text-sm bg-white">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                {["SKU", "Name", "Category", "Price", "Reorder Level", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No products found.</td></tr>}
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-blue-600">{p.sku}</td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{getCatName(p.category)}</td>
                  <td className="px-4 py-3">₹{p.unit_price}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${parseInt(p.unit_price) <= p.reorder_level ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                      {p.reorder_level}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editItem ? "Edit Product" : "Add Product"}</h2>
            {(["name", "sku", "description", "unit_price", "reorder_level"] as const).map(field => (
              <div key={field} className="mb-3">
                <label className="block text-sm text-gray-600 mb-1 capitalize">{field.replace("_", " ")}</label>
                <input type={field === "unit_price" || field === "reorder_level" ? "number" : "text"}
                  value={(form as any)[field]}
                  onChange={e => setForm({ ...form, [field]: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Select Category —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
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