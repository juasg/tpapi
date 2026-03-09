import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './PortalShell.css';

const NAV = [
  { to: '/portal/catalog',  label: 'Products' },
  { to: '/portal/orders',   label: 'Orders' },
  { to: '/portal/invoices', label: 'Invoices' },
  { to: '/portal/shipments',label: 'Shipments' },
];

export function PortalShell() {
  const { customer, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="shell">
      <header className="shell-header">
        <div className="shell-logo" onClick={() => navigate('/portal')}>
          <span className="logo-mark">TP</span>
          <span className="logo-text">TPAPI Portal</span>
        </div>
        <nav className="shell-nav">
          {NAV.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `shell-nav-link${isActive ? ' active' : ''}`}>
              {label}
            </NavLink>
          ))}
          <NavLink to="/devportal" className="shell-nav-link dev-link">Dev Portal</NavLink>
          <NavLink to="/admin"    className="shell-nav-link dev-link">Admin</NavLink>
        </nav>
        <div className="shell-user">
          {customer ? (
            <>
              <div className="user-info">
                <span className="user-name">{customer.companyName}</span>
                <span className="user-id">{customer.customerId}</span>
              </div>
              <button className="btn-ghost" onClick={logout}>Sign out</button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => navigate('/login')}>Sign in</button>
          )}
        </div>
      </header>
      <main className="shell-content">
        <Outlet />
      </main>
    </div>
  );
}
