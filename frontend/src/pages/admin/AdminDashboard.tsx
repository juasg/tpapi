import { useAdminStats } from '../../hooks/useAdmin';
import './AdminDashboard.css';

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent?: 'purple' | 'blue' | 'green' | 'yellow' | 'red';
}

function StatCard({ label, value, sub, accent = 'purple' }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function AdminDashboard() {
  const { data: stats, isLoading, error } = useAdminStats();

  return (
    <div className="adm-dashboard">
      <div className="adm-page-header">
        <h1 className="adm-page-title">Dashboard</h1>
        <p className="adm-page-sub">Platform overview — live data</p>
      </div>

      {isLoading && <div className="adm-loading">Loading stats…</div>}
      {error    && <div className="adm-error">Failed to load stats: {error.message}</div>}

      {stats && (
        <>
          <div className="stat-grid">
            <StatCard label="Total Customers"    value={stats.customers}            accent="blue"   />
            <StatCard label="Total Orders"       value={stats.orders}               accent="purple" />
            <StatCard label="Active API Keys"    value={stats.activeApiKeys}        accent="green"  />
            <StatCard
              label="Pending API Keys"
              value={stats.pendingApiKeys}
              sub={stats.pendingApiKeys > 0 ? 'Awaiting review' : undefined}
              accent={stats.pendingApiKeys > 0 ? 'yellow' : 'purple'}
            />
            <StatCard
              label="Pending Registrations"
              value={stats.pendingRegistrations}
              sub={stats.pendingRegistrations > 0 ? 'Awaiting approval' : undefined}
              accent={stats.pendingRegistrations > 0 ? 'yellow' : 'purple'}
            />
          </div>

          <div className="adm-quick-links">
            <h2 className="adm-section-title">Quick Actions</h2>
            <div className="quick-link-grid">
              <a href="/admin/customers" className="quick-link">
                <span className="quick-link-icon">⬡</span>
                <div>
                  <div className="quick-link-label">Manage Customers</div>
                  <div className="quick-link-sub">View customer list & approve registrations</div>
                </div>
              </a>
              <a href="/admin/orders" className="quick-link">
                <span className="quick-link-icon">◉</span>
                <div>
                  <div className="quick-link-label">View All Orders</div>
                  <div className="quick-link-sub">Monitor orders across all customers</div>
                </div>
              </a>
              <a href="/admin/api-keys" className="quick-link">
                <span className="quick-link-icon">⬢</span>
                <div>
                  <div className="quick-link-label">API Key Requests</div>
                  <div className="quick-link-sub">
                    {stats.pendingApiKeys > 0
                      ? `${stats.pendingApiKeys} pending — review now`
                      : 'No pending requests'}
                  </div>
                </div>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
