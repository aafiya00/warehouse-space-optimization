import { useState } from "react";
import warehouseBg from "../assets/warehouse-bg.jpg";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wos-page">

      {/* ── Background ── */}
      <div className="wos-bg">
        <div className="wos-bg-racks" style={{ backgroundImage: `url(${warehouseBg})` }} />
        <div className="wos-bg-orb wos-bg-orb-1" />
        <div className="wos-bg-orb wos-bg-orb-2" />
        <div className="wos-bg-orb wos-bg-orb-3" />
        <div className="wos-bg-orb wos-bg-orb-4" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="wos-particle" />
        ))}
        <div className="wos-floor-line" />
      </div>

      {/* ── Navbar ── */}
      <nav className="wos-navbar">
        <div className="wos-nav-logo">
          <div className="wos-nav-logo-icon">📦</div>
          <span className="wos-nav-logo-text">WOS</span>
        </div>

        <div className="wos-nav-center">
          <span className="wos-nav-link">
            <span className="wos-nav-icon">📊</span> Smart Analytics
          </span>
          <span className="wos-nav-link">
            <span className="wos-nav-icon">📐</span> Space Efficiency
          </span>
          <span className="wos-nav-link">
            <span className="wos-nav-icon">💰</span> Cost Optimization
          </span>
          <span className="wos-nav-link">
            <span className="wos-nav-icon">📈</span> Real-time Insights
          </span>
        </div>

        <button className="wos-nav-enterprise">
          🛡️ Enterprise Grade
        </button>
      </nav>

      {/* ── Body ── */}
      <div className="wos-body">

        {/* LEFT */}
        <div className="wos-left">
          <div className="wos-hero-top">

            <h1 className="wos-hero-title">
              <span className="wos-title-white">WAREHOUSE</span>
              <span className="wos-title-purple">SPACE</span>
              <span className="wos-title-accent">OPTIMIZATION</span>
              <span className="wos-title-white">SYSTEM</span>
            </h1>

            <div className="wos-title-underline" />

            <p className="wos-tagline">
              INTELLIGENT ANALYTICS.{" "}
              <span className="highlight">SMARTER DECISIONS.</span>{" "}
              MAXIMUM EFFICIENCY.
            </p>

            <p className="wos-desc">
              Transform your warehouse into a high-performance asset
              with <span className="ai-highlight">AI-powered</span> insights and data-driven optimization.
            </p>
          </div>
          <div className="wos-tag-grid">
  {[
    { icon: "🧠", label: "AI Slot Allocation" },
    { icon: "📊", label: "Predictive Analytics" },
    { icon: "📦", label: "Inventory Intelligence" },
    { icon: "📡", label: "Real-time Monitoring" },
    { icon: "📈", label: "Demand Forecasting" },
    { icon: "🔄", label: "Smart Replenishment" },
  ].map((t) => (
    <div className="wos-tag" key={t.label}>
      <span>{t.icon}</span>
      <span>{t.label}</span>
    </div>
  ))}
</div>

          {/* 3 Feature cards — no icons */}
          <div className="wos-feature-grid">
            {[
  {
    name: "Real-Time Analytics",
    desc: "Live insights for better, faster decisions.",
    metric: "98.7%",
    label: "Accuracy",
  },
  {
    name: "Inventory Tracking",
    desc: "Accurate tracking, zero guesswork.",
    metric: "99.1%",
    label: "Precision",
  },
  {
    name: "Smart Optimization",
    desc: "AI-driven layout recommendations.",
    metric: "94.6%",
    label: "Efficiency",
  },
            ].map((f) => (
              <div className="wos-feat-card" key={f.name}>
                <div className="wos-feat-top">
                  <div className="wos-feat-name">{f.name}</div>
                </div>
                <div className="wos-feat-desc">{f.desc}</div>
                <div className="wos-feat-metric">
                  <span className="wos-feat-pct">{f.metric}</span>
                  <span className="wos-feat-metric-label">{f.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Login card */}
        <div className="wos-right">
          <div className="wos-phone-card">

            {/* Logo */}
            <div className="wos-card-logo-wrap">
              <div className="wos-card-logo-hex">📦</div>
            </div>

            <h2 className="wos-card-title">Welcome Back</h2>
            <p className="wos-card-sub">Sign in to continue to your account</p>

            {error && <div className="wos-alert-error">⚠ {error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="wos-field">
                <div className="wos-input-wrap">
                  <span className="wos-input-icon">👤</span>
                  <input
                    className="wos-input"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="wos-field">
                <div className="wos-input-wrap">
                  <span className="wos-input-icon">🔒</span>
                  <input
                    className="wos-input"
                    type={showPass ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    className="wos-input-right"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="wos-row">
                <label className="wos-checkbox-label">
                  <input
                    type="checkbox"
                    className="wos-checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="wos-link">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="wos-btn-primary"
                disabled={loading}
              >
                <span>{loading ? "SIGNING IN…" : "SIGN IN"}</span>
                {!loading && <span>→</span>}
              </button>
            </form>

            <div className="wos-secure-line">
              <span>🛡️</span>
              <span>Secure. Reliable. Built for Performance.</span>
            </div>

            {/* ── Extra bottom details ── */}
            <hr className="wos-card-divider" />

            <div className="wos-card-stats">
              <div className="wos-stat-item">
                <span className="wos-stat-num">10K+</span>
                <span className="wos-stat-lbl">Warehouses</span>
              </div>
              <div className="wos-stat-item">
                <span className="wos-stat-num">99.9%</span>
                <span className="wos-stat-lbl">Uptime</span>
              </div>
              <div className="wos-stat-item">
                <span className="wos-stat-num">256-bit</span>
                <span className="wos-stat-lbl">Encrypted</span>
              </div>
            </div>

            <div className="wos-badges">
              <span className="wos-badge">🔒 SOC 2 Certified</span>
              <span className="wos-badge">✅ ISO 27001</span>
              <span className="wos-badge">⚡ 24/7 Support</span>
            </div>

            <p className="wos-card-footer">
              Don't have an account?{" "}
              <Link to="/register">Register</Link>
            </p>
            <div className="wos-card-bottom-footer">
  <span>🛡️</span>
  <span>© 2025 Warehouse Space Optimization System. All rights reserved.</span>
</div>

          </div>
        </div>
      </div>

      
    </div>
  );
}