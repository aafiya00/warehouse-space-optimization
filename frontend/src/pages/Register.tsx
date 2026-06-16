import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import "../auth.css";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "", email: "", password: "", first_name: "", last_name: "", phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/accounts/register/", form);
      navigate("/login");
    } catch (err: any) {
      const data = err.response?.data;
      if (data) {
        setError(Object.values(data).flat().join(" "));
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wos-auth-root">
      <div className="wos-orb wos-orb-1" />
      <div className="wos-orb wos-orb-2" />
      <div className="wos-orb wos-orb-3" />

      <div className="wos-bento-layout wos-bento-wide">
        {/* Left info panel */}
        <div className="wos-info-panel">
          <div>
            <div className="wos-logo-block">
              <div className="wos-logo-icon">📦</div>
              <span className="wos-logo-text">WOS</span>
            </div>
            <h1 className="wos-tagline">
              Join the<br />
              <span>Smart Warehouse</span><br />
              Network
            </h1>
            <p className="wos-sub">
              Create your account and start optimizing your warehouse operations with AI-driven insights.
            </p>
          </div>

          <div className="wos-stats-grid">
            <div className="wos-stat-card">
              <div className="wos-stat-icon">🏭</div>
              <div className="wos-stat-value">500<span>+</span></div>
              <div className="wos-stat-label">Warehouses</div>
            </div>
            <div className="wos-stat-card">
              <div className="wos-stat-icon">📦</div>
              <div className="wos-stat-value">2M<span>+</span></div>
              <div className="wos-stat-label">Items Tracked</div>
            </div>
          </div>

          <div className="wos-feature-list">
            {["Free to get started", "AI-powered layout tips", "Real-time inventory sync", "Role-based access control"].map(f => (
              <div className="wos-feature-item" key={f}>
                <div className="wos-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right glass card */}
        <div className="wos-glass-card">
          <div className="wos-card-logo">✨</div>
          <h2 className="wos-card-title">Create Account</h2>
          <p className="wos-card-sub">Fill in your details to get started</p>

          {error && <div className="wos-alert-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="wos-grid-2">
              <div className="wos-field">
                <label className="wos-label">First Name</label>
                <div className="wos-input-wrap">
                  <span className="wos-input-icon">👤</span>
                  <input className="wos-input" name="first_name" value={form.first_name}
                    onChange={handleChange} placeholder="John" />
                </div>
              </div>
              <div className="wos-field">
                <label className="wos-label">Last Name</label>
                <div className="wos-input-wrap">
                  <span className="wos-input-icon">👤</span>
                  <input className="wos-input" name="last_name" value={form.last_name}
                    onChange={handleChange} placeholder="Doe" />
                </div>
              </div>
            </div>

            <div className="wos-field">
              <label className="wos-label">Username *</label>
              <div className="wos-input-wrap">
                <span className="wos-input-icon">🏷️</span>
                <input className="wos-input" name="username" value={form.username}
                  onChange={handleChange} placeholder="johndoe123" required />
              </div>
            </div>

            <div className="wos-field">
              <label className="wos-label">Email *</label>
              <div className="wos-input-wrap">
                <span className="wos-input-icon">✉️</span>
                <input className="wos-input" type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="john@example.com" required />
              </div>
            </div>

            <div className="wos-grid-2">
              <div className="wos-field">
                <label className="wos-label">Phone</label>
                <div className="wos-input-wrap">
                  <span className="wos-input-icon">📱</span>
                  <input className="wos-input" name="phone" value={form.phone}
                    onChange={handleChange} placeholder="+91 00000 00000" />
                </div>
              </div>
              <div className="wos-field">
                <label className="wos-label">Password *</label>
                <div className="wos-input-wrap">
                  <span className="wos-input-icon">🔒</span>
                  <input className="wos-input" type={showPass ? "text" : "password"}
                    name="password" value={form.password} onChange={handleChange}
                    placeholder="Min 6 chars" required minLength={6}
                    style={{ paddingRight: "2.5rem" }} />
                  <button type="button" className="wos-input-right"
                    onClick={() => setShowPass(!showPass)}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
                <p className="wos-hint">Minimum 6 characters</p>
              </div>
            </div>

            <button type="submit" className="wos-btn-primary" disabled={loading} style={{ marginTop: "0.5rem" }}>
              {loading ? "Creating account…" : <><span>Create Account</span><span>→</span></>}
            </button>
          </form>

          <p className="wos-footer-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}