import { useState, useEffect } from "react";
import api from "../api/client";

interface Supplier {
  id: number;
  name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
}

const empty = { name: "", contact_email: "", contact_phone: "", address: "" };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get("/inventory/suppliers/");
      setSuppliers(res.data.results ?? res.data);
    } catch {
      setError("Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditItem(null); setForm(empty); setError(""); setShowForm(true); };
  const openEdit = (s: Supplier) => {
    setEditItem(s);
    setForm({ name: s.name, contact_email: s.contact_email, contact_phone: s.contact_phone, address: s.address });
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Supplier name is required."); return; }
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/inventory/suppliers/${editItem.id}/`, form);
      } else {
        await api.post("/inventory/suppliers/", form);
      }
      setShowForm(false);
      fetchAll();
    } catch {
      setError("Failed to save supplier. Check all fields.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this supplier?")) return;
    try {
      await api.delete(`/inventory/suppliers/${id}/`);
      fetchAll();
    } catch {
      setError("Failed to delete supplier.");
    }
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
        <button onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Add Supplier
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full md:w-80 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Name", "Email", "Phone", "Address", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No suppliers found.</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{s.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{s.contact_email || "—"}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{s.contact_phone || "—"}</td>
                  <td className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">{s.address || "—"}</td>
                  <td className="px-5 py-3 text-sm flex gap-2">
                    <button onClick={() => openEdit(s)}
                      className="text-blue-600 hover:underline font-medium">Edit</button>
                    <button onClick={() => handleDelete(s.id)}
                      className="text-red-500 hover:underline font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editItem ? "Edit Supplier" : "Add Supplier"}
            </h2>
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <div className="space-y-3">
              {[
                { label: "Supplier Name *", key: "name", type: "text" },
                { label: "Contact Email", key: "contact_email", type: "email" },
                { label: "Contact Phone", key: "contact_phone", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : editItem ? "Update" : "Create"}
              </button>
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}