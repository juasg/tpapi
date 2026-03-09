import { useState } from 'react';
import {
  useAdminCustomers,
  useAdminRegistrations,
  useAdminApproveRegistration,
  useAdminRejectRegistration,
  type Registration,
} from '../../hooks/useAdmin';
import './AdminCustomers.css';

const STATUS_CLASS: Record<string, string> = {
  PENDING:  'badge badge--yellow',
  APPROVED: 'badge badge--green',
  REJECTED: 'badge badge--red',
};

function RegistrationCard({ reg }: { reg: Registration }) {
  const [note, setNote]   = useState('');
  const [showCreds, setShowCreds] = useState<{ clientId: string; clientSecret: string } | null>(null);
  const approve = useAdminApproveRegistration();
  const reject  = useAdminRejectRegistration();

  const handleApprove = async () => {
    const result = await approve.mutateAsync({ id: reg.id, note });
    if ((result as any).credentials) {
      setShowCreds((result as any).credentials);
    }
  };

  return (
    <div className={`reg-card ${reg.status === 'PENDING' ? 'reg-card--pending' : ''}`}>
      <div className="reg-card-top">
        <div>
          <span className="reg-company">{reg.companyName}</span>
          <span className="reg-email">{reg.email}</span>
        </div>
        <span className={STATUS_CLASS[reg.status] ?? 'badge'}>{reg.status}</span>
      </div>
      <div className="reg-meta">
        {reg.phone   && <span><b>Phone:</b> {reg.phone}</span>}
        {reg.city    && <span><b>City:</b> {reg.city}, {reg.country}</span>}
        {reg.taxId   && <span><b>Tax ID:</b> {reg.taxId}</span>}
        <span><b>Submitted:</b> {new Date(reg.submittedAt).toLocaleString()}</span>
        {reg.reviewedAt && <span><b>Reviewed:</b> {new Date(reg.reviewedAt).toLocaleString()}</span>}
      </div>
      {reg.reviewNote && <div className="reg-note"><b>Note:</b> {reg.reviewNote}</div>}

      {showCreds && (
        <div className="reg-creds">
          <div className="reg-creds-title">Credentials — share securely with customer (shown once)</div>
          <div><b>Client ID:</b> <code>{showCreds.clientId}</code></div>
          <div><b>Client Secret:</b> <code>{showCreds.clientSecret}</code></div>
        </div>
      )}

      {reg.status === 'PENDING' && !showCreds && (
        <>
          <input
            className="reg-input"
            placeholder="Review note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="reg-actions">
            <button
              className="btn-approve"
              disabled={approve.isPending}
              onClick={handleApprove}
            >
              ✓ Approve & Issue Credentials
            </button>
            <button
              className="btn-reject"
              disabled={reject.isPending}
              onClick={() => reject.mutate({ id: reg.id, note })}
            >
              ✕ Reject
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminCustomers() {
  const [tab, setTab] = useState<'customers' | 'registrations'>('customers');
  const { data: customers, isLoading: loadingC } = useAdminCustomers();
  const { data: registrations, isLoading: loadingR } = useAdminRegistrations();

  const pending   = registrations?.filter((r) => r.status === 'PENDING')  ?? [];
  const reviewed  = registrations?.filter((r) => r.status !== 'PENDING')  ?? [];

  return (
    <div className="adm-customers">
      <div className="adm-page-header">
        <h1 className="adm-page-title">Customers</h1>
        <p className="adm-page-sub">Customer accounts and self-service registration requests</p>
      </div>

      <div className="adm-tabs">
        <button
          className={`adm-tab ${tab === 'customers' ? 'active' : ''}`}
          onClick={() => setTab('customers')}
        >
          Customer Accounts {customers ? `(${customers.length})` : ''}
        </button>
        <button
          className={`adm-tab ${tab === 'registrations' ? 'active' : ''}`}
          onClick={() => setTab('registrations')}
        >
          Registration Requests
          {pending.length > 0 && <span className="adm-tab-badge">{pending.length}</span>}
        </button>
      </div>

      {tab === 'customers' && (
        <>
          {loadingC && <div className="adm-loading">Loading customers…</div>}
          {customers && (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Customer ID</th><th>Company</th><th>City</th>
                  <th>Country</th><th>Email</th><th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td><code>{c.id}</code></td>
                    <td>{c.companyName}</td>
                    <td>{c.city}</td>
                    <td>{c.country}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === 'registrations' && (
        <>
          {loadingR && <div className="adm-loading">Loading registrations…</div>}

          {pending.length > 0 && (
            <section>
              <h2 className="adm-section-title">Pending ({pending.length})</h2>
              {pending.map((r) => <RegistrationCard key={r.id} reg={r} />)}
            </section>
          )}

          {pending.length === 0 && !loadingR && (
            <div className="adm-empty">No pending registration requests.</div>
          )}

          {reviewed.length > 0 && (
            <section style={{ marginTop: '2rem' }}>
              <h2 className="adm-section-title">Reviewed ({reviewed.length})</h2>
              {reviewed.map((r) => <RegistrationCard key={r.id} reg={r} />)}
            </section>
          )}
        </>
      )}
    </div>
  );
}
