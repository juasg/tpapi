import { useState } from 'react';
import { useAdminApiKeys, useAdminApprove, useAdminReject } from '../../hooks/useApiKeys';
import './AdminPanel.css';

export function AdminPanel() {
  const [secret, setSecret] = useState(sessionStorage.getItem('admin_secret') ?? '');
  const [unlocked, setUnlocked]   = useState(!!sessionStorage.getItem('admin_secret'));
  const [note, setNote]           = useState('');

  const { data: keys, isLoading, refetch } = useAdminApiKeys();
  const approve = useAdminApprove();
  const reject  = useAdminReject();

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('admin_secret', secret);
    setUnlocked(true);
    refetch();
  };

  const statusColor: Record<string, string> = {
    PENDING:  'adm-pending',
    ACTIVE:   'adm-active',
    REJECTED: 'adm-rejected',
    REVOKED:  'adm-revoked',
  };

  const pending  = keys?.filter((k) => k.status === 'PENDING')  ?? [];
  const reviewed = keys?.filter((k) => k.status !== 'PENDING')  ?? [];

  if (!unlocked) {
    return (
      <div className="adm-page">
        <h1 className="adm-title">Admin Panel</h1>
        <p className="adm-sub">Enter the admin secret to access key management.</p>
        <form className="adm-unlock-form" onSubmit={handleUnlock}>
          <input
            type="password"
            className="adm-input"
            placeholder="x-admin-secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            autoFocus
          />
          <button type="submit" className="adm-btn-primary">Unlock</button>
        </form>
      </div>
    );
  }

  return (
    <div className="adm-page">
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Admin — API Key Requests</h1>
          <p className="adm-sub">Approve or reject pending API key requests from customers.</p>
        </div>
        <button className="adm-btn-ghost" onClick={() => { sessionStorage.removeItem('admin_secret'); setUnlocked(false); }}>
          Lock
        </button>
      </div>

      {isLoading && <div className="adm-loading">Loading requests…</div>}

      {pending.length > 0 && (
        <section>
          <h2 className="adm-section-title">Pending Review ({pending.length})</h2>
          <div className="adm-cards">
            {pending.map((k) => (
              <div key={k.id} className="adm-card adm-card-pending">
                <div className="adm-card-top">
                  <div>
                    <span className="adm-company">{k.companyName}</span>
                    <span className="adm-custid">{k.customerId}</span>
                  </div>
                  <span className={`adm-status ${statusColor[k.status] ?? ''}`}>{k.status}</span>
                </div>
                <div className="adm-meta">
                  <span><b>Key Name:</b> {k.name}</span>
                  <span><b>Product:</b> {k.product}</span>
                  <span><b>Plan:</b> {k.plan}</span>
                  <span><b>Requested:</b> {new Date(k.requestedAt).toLocaleString()}</span>
                </div>
                <div className="adm-usecase">
                  <b>Use Case:</b> {k.useCase}
                </div>
                <div className="adm-note-row">
                  <input
                    className="adm-input adm-note-input"
                    placeholder="Review note (optional)"
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <div className="adm-actions">
                  <button
                    className="adm-btn-approve"
                    disabled={approve.isPending}
                    onClick={() => approve.mutate({ id: k.id, note })}
                  >
                    ✓ Approve — Issue Key
                  </button>
                  <button
                    className="adm-btn-reject"
                    disabled={reject.isPending}
                    onClick={() => reject.mutate({ id: k.id, note })}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {pending.length === 0 && !isLoading && (
        <div className="adm-empty">No pending requests.</div>
      )}

      {reviewed.length > 0 && (
        <section>
          <h2 className="adm-section-title">Reviewed ({reviewed.length})</h2>
          <table className="adm-table">
            <thead>
              <tr><th>Company</th><th>Product</th><th>Plan</th><th>Status</th><th>Key</th><th>Reviewed</th></tr>
            </thead>
            <tbody>
              {reviewed.map((k) => (
                <tr key={k.id}>
                  <td><div>{k.companyName}</div><small>{k.customerId}</small></td>
                  <td>{k.product}</td>
                  <td>{k.plan}</td>
                  <td><span className={`adm-status ${statusColor[k.status] ?? ''}`}>{k.status}</span></td>
                  <td className="adm-key-cell">
                    {k.key ? <code>{k.key.slice(0, 20)}…</code> : '—'}
                  </td>
                  <td>{k.reviewedAt ? new Date(k.reviewedAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
