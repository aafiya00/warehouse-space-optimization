import { useState, useEffect } from "react";
import api from "../api/client";

interface Bin {
  id: number;
  rack: number;
  code: string;
  capacity: number;
}

interface Rack {
  id: number;
  name: string;
  code: string;
}

export default function Bins() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Bin | null>(null);
  const [form, setForm] = useState({ rack: "", code: "", capacity: "100" });
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, rRes] = await Promise.all([
        api.get("/warehouses/bins/"),
        api.get("/warehouses/racks/"),
      ]);
      setBins(bRes.data.results ?? bRes.data);
      setRacks(rRes.data.results ?? rRes.data);
    } catch {
      setError("Failed to load bins.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditItem(null); setForm({ rack: "", code: "", capacity: "100" }); setShowForm(true); };
  const openEdit = (b: Bin) => { setEditItem(b); setForm({ rack: String(b.rack), code: b.code, capacity: String(b.capacity) }); setShowForm(true); };

  const handleSubmit = async () => {
    try {
      const payload = { rack: Number(form.rack), code: form.code, capacity: Number(form.capacity) };
      if (editItem) {
        await api.put(`/warehouses/bins/${editItem.id}/`, payload);
      } else {
        await api.post("/warehouses/bins/", payload);
      }
      setShowForm(false);
      fetchData();
    } catch { alert("Save failed. Check all fields."); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this bin?")) return;
    await api.delete(`/warehouses/bins/${id}/`);
    fetchData();
  };

  const filtered = bins.filter(b =>
    b.code.toLowerCase().includes(search.toLowerCase()) ||
    String(b.capacity).includes(search)
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bins</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Add Bin
        </button>
      </div>

      <input type="text" placeholder="Search by code or capacity..."
        value={search} onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && (
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="w-full text-sm bg-white">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Rack</th>
                <th className="px-4 py-3 text-left">Capacity</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">No bins found.</td></tr>
              )}
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-green-600">{b.code}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {racks.find(r => r.id === b.rack)?.name ?? `Rack #${b.rack}`}
                  </td>
                  <td className="px-4 py-3">{b.capacity}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(b)} className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200">Edit</button>
                    <button onClick={() => handleDelete(b.id)} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200">Delete</button>
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
            <h2 className="text-lg font-semibold mb-4">{editItem ? "Edit Bin" : "Add Bin"}</h2>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Rack</label>
              <select value={form.rack} onChange={e => setForm({ ...form, rack: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select rack...</option>
                {racks.map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Code</label>
              <input type="text" value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Capacity</label>
              <input type="number" value={form.capacity}
                onChange={e => setForm({ ...form, capacity: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
