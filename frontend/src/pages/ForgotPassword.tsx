import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import "../auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/accounts/forgot-password/", { email });
      setMessage("If this email exists, a reset link has been sent. Check your inbox.");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wos-auth-root">
      <div className="wos-orb wos-orb-1" />
      <div className="wos-orb wos-orb-2" />
      <div className="wos-orb wos-orb-3" />

      <div className="wos-bento-layout">
        {/* Left info panel */}
        <div className="wos-info-panel">
          <div>
            <div className="wos-logo-block">
              <div className="wos-logo-icon">📦</div>
              <span className="wos-logo-text">WOS</span>
            </div>
            <h1 className="wos-tagline">
              Secure<br />
              <span>Account Recovery</span>
            </h1>
            <p className="wos-sub">
              We'll send a secure reset link to your registered email address.
              Your data stays safe and encrypted.
            </p>
          </div>

          <div className="wos-stats-grid">
            <div className="wos-stat-card">
              <div className="wos-stat-icon">🔐</div>
              <div className="wos-stat-value">256<span>-bit</span></div>
              <div className="wos-stat-label">Encryption</div>
            </div>
            <div className="wos-stat-card">
              <div className="wos-stat-icon">⏱️</div>
              <div className="wos-stat-value">15<span>min</span></div>
              <div className="wos-stat-label">Link Expiry</div>
            </div>
          </div>

          <div className="wos-feature-list">
            {["Secure email verification", "Token-based reset link", "One-time use only", "Instant delivery"].map(f => (
              <div className="wos-feature-item" key={f}>
                <div className="wos-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right glass card */}
        <div className="wos-glass-card">
          <div className="wos-card-logo">🔑</div>
          <h2 className="wos-card-title">Forgot Password?</h2>
          <p className="wos-card-sub">Enter your email and we'll send a reset link.</p>

          {message && (
            <div className={message.includes("wrong") ? "wos-alert-error" : "wos-alert-success"}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="wos-field">
              <label className="wos-label">Email Address</label>
              <div className="wos-input-wrap">
                <span className="wos-input-icon">✉️</span>
                <input
                  className="wos-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" className="wos-btn-primary" disabled={loading} style={{ marginTop: "0.5rem" }}>
              {loading ? "Sending…" : <><span>Send Reset Link</span><span>→</span></>}
            </button>
          </form>

          <div style={{ marginTop: "1.25rem" }} className="wos-footer-text">
            Remembered it? <Link to="/login">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}