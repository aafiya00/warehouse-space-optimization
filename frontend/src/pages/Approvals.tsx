import { useState, useEffect } from "react";
import api from "../api/client";

interface Approval {
  id: number;
  request_type: string;
  status: string;
  requested_by: number;
  product: number;
  product_name?: string;
  bin: number;
  bin_code?: string;
  quantity: number;
  note: string;
  created_at: string;
  reviewed_at: string | null;
  rejection_reason?: string;
}

interface Product { id: number; name: string; sku: string; }
interface Bin { id: number; code: string; }

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

const emptyForm = { request_type: "stock_in", product: "", bin: "", quantity: "1", note: "" };

export default function Approvals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get("/approvals/requests/");
      setApprovals(res.data.results ?? res.data);
    } catch {
      setError("Failed to load approvals.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [p, b] = await Promise.all([
        api.get("/inventory/products/"),
        api.get("/warehouses/bins/"),
      ]);
      setProducts(p.data.results ?? p.data);
      setBins(b.data.results ?? b.data);
    } catch {
      // dropdowns optional
    }
  };

  useEffect(() => { fetchApprovals(); fetchDropdowns(); }, []);

  const openForm = () => { setForm(emptyForm); setError(""); setShowForm(true); };

  const handleSubmit = async () => {
    if (!form.product || !form.bin || !form.quantity) {
      setError("Product, Bin and Quantity are required."); return;
    }
    setSaving(true);
    try {
      await api.post("/approvals/requests/", {
        request_type: form.request_type,
        product: Number(form.product),
        bin: Number(form.bin),
        quantity: Number(form.quantity),
        note: form.note,
      });
      setShowForm(false);
      fetchApprovals();
    } catch {
      setError("Failed to submit request. Check all fields.");
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (id: number, action: "approve" | "reject") => {
    try {
      await api.post(`/approvals/requests/${id}/${action}/`);
      fetchApprovals();
    } catch { alert(`Failed to ${action} request.`); }
  };

  const filtered = filter === "all" ? approvals : approvals.filter(a => a.status === filter);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">Manage stock requests and transfer approvals</p>
        </div>
        <button onClick={openForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          + New Request
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {["all", "pending", "approved", "rejected"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl shadow">
              No {filter === "all" ? "" : filter} requests found.
            </div>
          )}
          {filtered.map(a => (
            <div key={a.id} className="bg-white rounded-xl shadow p-5 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-gray-800 capitalize">
                    {a.request_type.replace(/_/g, " ")}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {a.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Product:</span> {a.product_name ?? `#${a.product}`} &nbsp;|&nbsp;
                  <span className="font-medium">Bin:</span> {a.bin_code ?? `#${a.bin}`} &nbsp;|&nbsp;
                  <span className="font-medium">Qty:</span> {a.quantity}
                </p>
                {a.note && <p className="text-sm text-gray-500 mb-1">{a.note}</p>}
                {a.rejection_reason && (
                  <p className="text-sm text-red-500">Reason: {a.rejection_reason}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Submitted: {new Date(a.created_at).toLocaleString()}
                  {a.reviewed_at && ` · Reviewed: ${new Date(a.reviewed_at).toLocaleString()}`}
                </p>
              </div>
              {a.status === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleAction(a.id, "approve")}
                    className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm hover:bg-green-200 font-medium">
                    ✓ Approve
                  </button>
                  <button onClick={() => handleAction(a.id, "reject")}
                    className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-200 font-medium">
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">New Approval Request</h2>
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
                <select value={form.request_type}
                  onChange={e => setForm({ ...form, request_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="stock_in">Stock In</option>
                  <option value="stock_out">Stock Out</option>
                  <option value="transfer">Transfer</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                <select value={form.product}
                  onChange={e => setForm({ ...form, product: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bin *</label>
                <select value={form.bin}
                  onChange={e => setForm({ ...form, bin: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select bin...</option>
                  {bins.map(b => (
                    <option key={b.id} value={b.id}>{b.code}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input type="number" min="1" value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  rows={2} placeholder="Optional note..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                {saving ? "Submitting..." : "Submit Request"}
              </button>
              <button onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}