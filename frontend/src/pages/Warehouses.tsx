import { useState, useEffect } from "react";
import axios from "axios";

interface Warehouse {
  id: number;
  name: string;
  location: string;
  code: string;
}

const API = "http://localhost:8000/api/warehouses/warehouses/";

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Warehouse | null>(null);
  const [form, setForm] = useState({ name: "", location: "", code: "" });
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("access");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API, { headers });
      setWarehouses(res.data.results ?? res.data);
    } catch {
      setError("Failed to load warehouses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditItem(null); setForm({ name: "", location: "", code: "" }); setShowForm(true); };
  const openEdit = (w: Warehouse) => { setEditItem(w); setForm({ name: w.name, location: w.location, code: w.code }); setShowForm(true); };

  const handleSubmit = async () => {
    try {
      if (editItem) {
        await axios.put(`${API}${editItem.id}/`, form, { headers });
      } else {
        await axios.post(API, form, { headers });
      }
      setShowForm(false);
      fetchData();
    } catch {
      alert("Save failed. Check all fields.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this warehouse?")) return;
    await axios.delete(`${API}${id}/`, { headers });
    fetchData();
  };

  const filtered = warehouses.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.code.toLowerCase().includes(search.toLowerCase()) ||
    w.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Warehouses</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Add Warehouse
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, code, or location..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Table */}
      {!loading && (
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="w-full text-sm bg-white">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">No warehouses found.</td></tr>
              )}
              {filtered.map(w => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-blue-600">{w.code}</td>
                  <td className="px-4 py-3">{w.name}</td>
                  <td className="px-4 py-3 text-gray-500">{w.location}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(w)} className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200">Edit</button>
                    <button onClick={() => handleDelete(w.id)} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">{editItem ? "Edit Warehouse" : "Add Warehouse"}</h2>
            {["name", "location", "code"].map(field => (
              <div key={field} className="mb-3">
                <label className="block text-sm text-gray-600 mb-1 capitalize">{field}</label>
                <input
                  type="text"
                  value={(form as any)[field]}
                  onChange={e => setForm({ ...form, [field]: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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