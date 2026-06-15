import { useState, useEffect } from "react";
import api from "../api/client";

interface Notification {
  id: number;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  low_stock: "⚠️",
  approval: "✅",
  rejection: "❌",
  transfer: "🔄",
  info: "ℹ️",
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications/");
      setNotifications(res.data.results ?? res.data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/`, { is_read: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.post("/notifications/mark-all-read/");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      // fallback: mark all locally
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const displayed = filter === "unread"
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="text-sm text-blue-600 hover:underline font-medium">
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {(["all", "unread"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {f} {f === "unread" && unreadCount > 0 && `(${unreadCount})`}
          </button>
        ))}
      </div>

      {loading ? <p className="text-gray-400">Loading...</p> : (
        <div className="space-y-3">
          {displayed.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow text-gray-400">
              <div className="text-4xl mb-2">🔔</div>
              <p>No {filter === "unread" ? "unread " : ""}notifications.</p>
            </div>
          )}
          {displayed.map(n => (
            <div key={n.id}
              className={`bg-white rounded-xl shadow p-4 flex items-start gap-4 transition ${!n.is_read ? "border-l-4 border-blue-500" : "opacity-70"}`}>
              <span className="text-2xl mt-0.5">
                {TYPE_ICONS[n.notification_type] ?? "🔔"}
              </span>
              <div className="flex-1">
                <p className={`text-sm ${!n.is_read ? "font-semibold text-gray-800" : "text-gray-600"}`}>
                  {n.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              {!n.is_read && (
                <button onClick={() => markRead(n.id)}
                  className="text-xs text-blue-600 hover:underline shrink-0 mt-1">
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}