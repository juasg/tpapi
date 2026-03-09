import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './AdminShell.css';

const NAV = [
  { to: '/admin/dashboard',  label: 'Dashboard',    icon: '◈' },
  { to: '/admin/customers',  label: 'Customers',     icon: '⬡' },
  { to: '/admin/orders',     label: 'Orders',        icon: '◉' },
  { to: '/admin/api-keys',   label: 'API Keys',      icon: '⬢' },
];

export function AdminShell() {
  const [secret, setSecret]   = useState(sessionStorage.getItem('admin_secret') ?? '');
  const [unlocked, setUnlocked] = useState(!!sessionStorage.getItem('admin_secret'));
  const navigate = useNavigate();

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('admin_secret', secret);
    setUnlocked(true);
  };

  const handleLock = () => {
    sessionStorage.removeItem('admin_secret');
    setSecret('');
    setUnlocked(false);
  };

  if (!unlocked) {
    return (
      <div className="adm-gate">
        <div className="adm-gate-card">
          <div className="adm-gate-logo">
            <span className="adm-gate-mark">TP</span>
            <span className="adm-gate-brand">Admin</span>
          </div>
          <h1 className="adm-gate-title">Admin Access</h1>
          <p className="adm-gate-sub">Enter your admin secret to manage the platform.</p>
          <form className="adm-gate-form" onSubmit={handleUnlock}>
            <input
              type="password"
              className="adm-gate-input"
              placeholder="x-admin-secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoFocus
            />
            <button type="submit" className="adm-gate-btn">Unlock →</button>
          </form>
          <button className="adm-gate-back" type="button" onClick={() => navigate('/portal')}>
            ← Back to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-shell">
      <aside className="adm-sidebar">
        <div className="adm-sidebar-logo">
          <span className="adm-logo-mark">TP</span>
          <span className="adm-logo-text">Admin</span>
        </div>
        <nav className="adm-nav">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `adm-nav-link${isActive ? ' active' : ''}`}
            >
              <span className="adm-nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="adm-sidebar-footer">
          <button className="adm-nav-link adm-lock-btn" onClick={handleLock}>
            <span className="adm-nav-icon">⊗</span>
            Lock
          </button>
          <button className="adm-nav-link adm-portal-btn" onClick={() => navigate('/portal')}>
            <span className="adm-nav-icon">↗</span>
            Portal
          </button>
        </div>
      </aside>
      <main className="adm-main">
        <Outlet />
      </main>
    </div>
  );
}
