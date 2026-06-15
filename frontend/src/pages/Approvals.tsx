import { useState, useEffect } from "react";
import api from "../api/client";

interface Approval {
  id: number;
  request_type: string;
  status: string;
  requested_by: number;
  notes: string;
  created_at: string;
  reviewed_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

export default function Approvals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ request_type: "stock_request", notes: "" });
  const [filter, setFilter] = useState("all");

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get("/approvals/");
      setApprovals(res.data.results ?? res.data);
    } catch {
      setError("Failed to load approvals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, []);

  const handleSubmit = async () => {
    try {
      await api.post("/approvals/", form);
      setShowForm(false);
      setForm({ request_type: "stock_request", notes: "" });
      fetchApprovals();
    } catch { alert("Failed to submit request."); }
  };

  const handleAction = async (id: number, action: "approve" | "reject") => {
    try {
      await api.post(`/approvals/${id}/${action}/`);
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
        <button onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + New Request
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {["all", "pending", "approved", "rejected"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {loading ? <p className="text-gray-400">Loading...</p> : (
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
                    {a.request_type.replace("_", " ")}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {a.status.toUpperCase()}
                  </span>
                </div>
                {a.notes && <p className="text-sm text-gray-500 mb-2">{a.notes}</p>}
                <p className="text-xs text-gray-400">
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

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">New Approval Request</h2>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Request Type</label>
              <select value={form.request_type}
                onChange={e => setForm({ ...form, request_type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="stock_request">Stock Request</option>
                <option value="transfer">Transfer</option>
                <option value="adjustment">Adjustment</option>
                <option value="disposal">Disposal</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Notes</label>
              <textarea value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3} placeholder="Describe your request..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Submit</button>
              <button onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}