import { useState } from 'react';
import { useAdminApiKeys, useAdminApproveApiKey, useAdminRejectApiKey } from '../../hooks/useAdmin';
import type { ApiKey } from '../../types';
import './AdminApiKeys.css';

const STATUS_CLASS: Record<string, string> = {
  PENDING:  'badge badge--yellow',
  ACTIVE:   'badge badge--green',
  REJECTED: 'badge badge--red',
  REVOKED:  'badge badge--gray',
};

function KeyCard({ k }: { k: ApiKey }) {
  const [note, setNote] = useState('');
  const approve = useAdminApproveApiKey();
  const reject  = useAdminRejectApiKey();

  return (
    <div className={`key-card ${k.status === 'PENDING' ? 'key-card--pending' : ''}`}>
      <div className="key-card-top">
        <div>
          <span className="key-company">{k.companyName}</span>
          <span className="key-custid">{k.customerId}</span>
        </div>
        <span className={STATUS_CLASS[k.status] ?? 'badge'}>{k.status}</span>
      </div>

      <div className="key-meta">
        <span><b>Key Name:</b> {k.name}</span>
        <span><b>Product:</b> {k.product}</span>
        <span><b>Plan:</b> {k.plan}</span>
        <span><b>Requested:</b> {new Date(k.requestedAt).toLocaleString()}</span>
        {k.reviewedAt && <span><b>Reviewed:</b> {new Date(k.reviewedAt).toLocaleString()}</span>}
      </div>

      <div className="key-usecase"><b>Use Case:</b> {k.useCase}</div>

      {k.key && (
        <div className="key-value"><b>API Key:</b> <code>{k.key.slice(0, 28)}…</code></div>
      )}
      {k.reviewNote && (
        <div className="key-note"><b>Note:</b> {k.reviewNote}</div>
      )}

      {k.status === 'ACTIVE' && (
        <div className="key-usage">
          <span>Requests today: <b>{k.requestsToday} / {k.requestsLimit.toLocaleString()}</b></span>
          {k.lastUsedAt && <span>Last used: <b>{new Date(k.lastUsedAt).toLocaleString()}</b></span>}
        </div>
      )}

      {k.status === 'PENDING' && (
        <>
          <input
            className="key-input"
            placeholder="Review note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="key-actions">
            <button
              className="btn-approve"
              disabled={approve.isPending}
              onClick={() => approve.mutate({ id: k.id, note })}
            >
              ✓ Approve — Issue Key
            </button>
            <button
              className="btn-reject"
              disabled={reject.isPending}
              onClick={() => reject.mutate({ id: k.id, note })}
            >
              ✕ Reject
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminApiKeys() {
  const { data: keys, isLoading } = useAdminApiKeys();

  const pending  = keys?.filter((k) => k.status === 'PENDING') ?? [];
  const reviewed = keys?.filter((k) => k.status !== 'PENDING') ?? [];

  return (
    <div className="adm-apikeys">
      <div className="adm-page-header">
        <h1 className="adm-page-title">API Key Requests</h1>
        <p className="adm-page-sub">Approve or reject customer API key requests</p>
      </div>

      {isLoading && <div className="adm-loading">Loading…</div>}

      {pending.length > 0 && (
        <section>
          <h2 className="adm-section-title">Pending Review ({pending.length})</h2>
          {pending.map((k) => <KeyCard key={k.id} k={k} />)}
        </section>
      )}

      {pending.length === 0 && !isLoading && (
        <div className="adm-empty">No pending API key requests.</div>
      )}

      {reviewed.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <h2 className="adm-section-title">Reviewed ({reviewed.length})</h2>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Company</th><th>Product</th><th>Plan</th>
                <th>Status</th><th>Key</th><th>Reviewed</th>
              </tr>
            </thead>
            <tbody>
              {reviewed.map((k) => (
                <tr key={k.id}>
                  <td>
                    <div className="key-company">{k.companyName}</div>
                    <small>{k.customerId}</small>
                  </td>
                  <td>{k.product}</td>
                  <td>{k.plan}</td>
                  <td><span className={STATUS_CLASS[k.status] ?? 'badge'}>{k.status}</span></td>
                  <td>{k.key ? <code>{k.key.slice(0, 20)}…</code> : '—'}</td>
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
