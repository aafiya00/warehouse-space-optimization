import { useEffect, useState } from "react";
import api from "../api/client";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
}

interface LoginHistoryItem {
  id: number;
  ip_address: string;
  success: boolean;
  timestamp: string;
  user_agent: string;
}

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<LoginHistoryItem[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/v1/accounts/me/").then((r) => {
      setUser(r.data);
      setForm({
        first_name: r.data.first_name || "",
        last_name: r.data.last_name || "",
        email: r.data.email || "",
        phone: r.data.phone || "",
      });
    });
    api.get("/api/v1/accounts/login-history/").then((r) => setHistory(r.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    setError("");
    try {
      const r = await api.patch("/api/v1/accounts/me/", form);
      setUser(r.data);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save. Please check your input.");
    }
  };

  if (!user) return <div className="p-6 text-gray-500">Loading profile...</div>;

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-700",
    manager: "bg-blue-100 text-blue-700",
    supervisor: "bg-purple-100 text-purple-700",
    staff: "bg-green-100 text-green-700",
    viewer: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Profile saved successfully!
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white shadow rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user.first_name || user.username} {user.last_name}</h2>
              <p className="text-gray-500 text-sm">@{user.username}</p>
            </div>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${roleColors[user.role] || "bg-gray-100 text-gray-600"}`}>
            {user.role}
          </span>
        </div>

        {editing ? (
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {[
              { label: "First Name", key: "first_name" },
              { label: "Last Name", key: "last_name" },
              { label: "Email", key: "email" },
              { label: "Phone", key: "phone" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm text-gray-500 mb-1">{label}</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="col-span-2 flex gap-3 mt-2">
              <button onClick={handleSave}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700">
                Save Changes
              </button>
              <button onClick={() => setEditing(false)}
                className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3 mt-4 text-sm">
            <div><span className="text-gray-400">Email:</span> <span className="font-medium">{user.email || "—"}</span></div>
            <div><span className="text-gray-400">Phone:</span> <span className="font-medium">{user.phone || "—"}</span></div>
            <div><span className="text-gray-400">Role:</span> <span className="font-medium capitalize">{user.role}</span></div>
            <div>
              <button onClick={() => setEditing(true)}
                className="text-indigo-600 hover:underline text-sm">
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Login History */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Login History</h2>
        {history.length === 0 ? (
          <p className="text-gray-400 text-sm">No login history available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">Date / Time</th>
                  <th className="py-2 pr-4">IP Address</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 pr-4 text-gray-600">{new Date(h.timestamp).toLocaleString()}</td>
                    <td className="py-2 pr-4 font-mono text-gray-700">{h.ip_address || "—"}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${h.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {h.success ? "Success" : "Failed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


