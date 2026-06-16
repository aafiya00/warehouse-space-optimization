import { useState, useEffect } from "react";
import api from "../api/client";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

const ROLES = ["admin", "manager", "supervisor", "staff", "viewer"];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [roleValue, setRoleValue] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/users/");
      setUsers(res.data.results ?? res.data);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openEdit = (u: User) => { setEditUser(u); setRoleValue(u.role); setError(""); };

  const handleRoleUpdate = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await api.patch(`/auth/users/${editUser.id}/`, { role: roleValue });
      setEditUser(null);
      fetchUsers();
    } catch {
      setError("Failed to update role.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: User) => {
    try {
      await api.patch(`/auth/users/${u.id}/`, { is_active: !u.is_active });
      fetchUsers();
    } catch {
      setError("Failed to update user status.");
    }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    manager: "bg-blue-100 text-blue-700",
    supervisor: "bg-indigo-100 text-indigo-700",
    staff: "bg-green-100 text-green-700",
    viewer: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <span className="text-sm text-gray-500">{users.length} total users</span>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by username or email..."
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
                {["Username", "Email", "Name", "Role", "Status", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No users found.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{u.username}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${roleBadge[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm flex gap-3">
                    <button onClick={() => openEdit(u)}
                      className="text-blue-600 hover:underline font-medium">Edit Role</button>
                    <button onClick={() => toggleActive(u)}
                      className={`font-medium hover:underline ${u.is_active ? "text-red-500" : "text-green-600"}`}>
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Edit Role</h2>
            <p className="text-sm text-gray-500 mb-4">User: <strong>{editUser.username}</strong></p>
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={roleValue}
              onChange={e => setRoleValue(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5">
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={handleRoleUpdate} disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : "Update Role"}
              </button>
              <button onClick={() => setEditUser(null)}
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