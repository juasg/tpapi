import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './DevPortalShell.css';

const NAV = [
  { to: '/devportal/apis',       label: 'API Catalog' },
  { to: '/devportal/keys',       label: 'My API Keys' },
  { to: '/devportal/playground', label: 'Playground' },
  { to: '/devportal/onboarding', label: 'Get Started' },
  { to: '/devportal/admin',      label: 'Admin' },
];

export function DevPortalShell() {
  const { customer, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="dev-shell">
      <header className="dev-header">
        <div className="dev-logo" onClick={() => navigate('/devportal')}>
          <span className="dev-logo-mark">&lt;/&gt;</span>
          <span className="dev-logo-text">TPAPI Developer Portal</span>
        </div>
        <nav className="dev-nav">
          {NAV.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `dev-nav-link${isActive ? ' active' : ''}`}>
              {label}
            </NavLink>
          ))}
          <NavLink to="/portal" className="dev-nav-link portal-link">Order Portal</NavLink>
        </nav>
        <div className="dev-user">
          {customer ? (
            <>
              <div className="dev-user-info">
                <span className="dev-company">{customer.companyName}</span>
                <span className="dev-custid">{customer.customerId}</span>
              </div>
              <button className="dev-btn-ghost" onClick={logout}>Sign out</button>
            </>
          ) : (
            <button className="dev-btn-primary" onClick={() => navigate('/login')}>Sign in</button>
          )}
        </div>
      </header>
      <main className="dev-content">
        <Outlet />
      </main>
    </div>
  );
}
