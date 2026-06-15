import { useState, useEffect } from "react";
import api from "../api/client";

interface Zone {
  id: number;
  warehouse: number;
  warehouse_name?: string;
  name: string;
  code: string;
}

interface Warehouse {
  id: number;
  name: string;
  code: string;
}

export default function Zones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Zone | null>(null);
  const [form, setForm] = useState({ warehouse: "", name: "", code: "" });
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [zRes, wRes] = await Promise.all([
        api.get("/warehouses/zones/"),
        api.get("/warehouses/warehouses/"),
      ]);
      setZones(zRes.data.results ?? zRes.data);
      setWarehouses(wRes.data.results ?? wRes.data);
    } catch {
      setError("Failed to load zones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditItem(null); setForm({ warehouse: "", name: "", code: "" }); setShowForm(true); };
  const openEdit = (z: Zone) => { setEditItem(z); setForm({ warehouse: String(z.warehouse), name: z.name, code: z.code }); setShowForm(true); };

  const handleSubmit = async () => {
    try {
      const payload = { ...form, warehouse: Number(form.warehouse) };
      if (editItem) {
        await api.put(`/warehouses/zones/${editItem.id}/`, payload);
      } else {
        await api.post("/warehouses/zones/", payload);
      }
      setShowForm(false);
      fetchData();
    } catch { alert("Save failed. Check all fields."); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this zone?")) return;
    await api.delete(`/warehouses/zones/${id}/`);
    fetchData();
  };

  const filtered = zones.filter(z =>
    z.name.toLowerCase().includes(search.toLowerCase()) ||
    z.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Zones</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Add Zone
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name or code..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && (
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="w-full text-sm bg-white">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Warehouse</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">No zones found.</td></tr>
              )}
              {filtered.map(z => (
                <tr key={z.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-purple-600">{z.code}</td>
                  <td className="px-4 py-3">{z.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {warehouses.find(w => w.id === z.warehouse)?.name ?? `Warehouse #${z.warehouse}`}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(z)} className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200">Edit</button>
                    <button onClick={() => handleDelete(z.id)} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">{editItem ? "Edit Zone" : "Add Zone"}</h2>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Warehouse</label>
              <select value={form.warehouse} onChange={e => setForm({ ...form, warehouse: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select warehouse...</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
              </select>
            </div>
            {["name", "code"].map(field => (
              <div key={field} className="mb-3">
                <label className="block text-sm text-gray-600 mb-1 capitalize">{field}</label>
                <input type="text" value={(form as any)[field]}
                  onChange={e => setForm({ ...form, [field]: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
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
