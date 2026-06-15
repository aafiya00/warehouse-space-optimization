import { useState, useEffect } from "react";
import api from "../api/client";

interface Rack {
  id: number;
  zone: number;
  name: string;
  code: string;
}

interface Zone {
  id: number;
  name: string;
  code: string;
  warehouse: number;
}

export default function Racks() {
  const [racks, setRacks] = useState<Rack[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Rack | null>(null);
  const [form, setForm] = useState({ zone: "", name: "", code: "" });
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rRes, zRes] = await Promise.all([
        api.get("/warehouses/racks/"),
        api.get("/warehouses/zones/"),
      ]);
      setRacks(rRes.data.results ?? rRes.data);
      setZones(zRes.data.results ?? zRes.data);
    } catch {
      setError("Failed to load racks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditItem(null); setForm({ zone: "", name: "", code: "" }); setShowForm(true); };
  const openEdit = (r: Rack) => { setEditItem(r); setForm({ zone: String(r.zone), name: r.name, code: r.code }); setShowForm(true); };

  const handleSubmit = async () => {
    try {
      const payload = { ...form, zone: Number(form.zone) };
      if (editItem) {
        await api.put(`/warehouses/racks/${editItem.id}/`, payload);
      } else {
        await api.post("/warehouses/racks/", payload);
      }
      setShowForm(false);
      fetchData();
    } catch { alert("Save failed. Check all fields."); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this rack?")) return;
    await api.delete(`/warehouses/racks/${id}/`);
    fetchData();
  };

  const filtered = racks.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Racks</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Add Rack
        </button>
      </div>

      <input type="text" placeholder="Search by name or code..."
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
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Zone</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">No racks found.</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-yellow-600">{r.code}</td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {zones.find(z => z.id === r.zone)?.name ?? `Zone #${r.zone}`}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(r)} className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200">Edit</button>
                    <button onClick={() => handleDelete(r.id)} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200">Delete</button>
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
            <h2 className="text-lg font-semibold mb-4">{editItem ? "Edit Rack" : "Add Rack"}</h2>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Zone</label>
              <select value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select zone...</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name} ({z.code})</option>)}
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
