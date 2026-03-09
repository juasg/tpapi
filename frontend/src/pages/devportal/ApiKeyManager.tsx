import { useState } from 'react';
import { useApiKeys, useRequestApiKey, useRevokeApiKey } from '../../hooks/useApiKeys';
import { useApiProducts } from '../../hooks/useDevPortal';
import type { ApiKeyStatus } from '../../types';
import './ApiKeyManager.css';

const STATUS_STYLE: Record<ApiKeyStatus, string> = {
  ACTIVE:   'key-active',
  PENDING:  'key-pending',
  APPROVED: 'key-active',
  REJECTED: 'key-revoked',
  REVOKED:  'key-revoked',
};

export function ApiKeyManager() {
  const { data: keys, isLoading } = useApiKeys();
  const { data: products } = useApiProducts();
  const requestKey = useRequestApiKey();
  const revokeKey = useRevokeApiKey();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', product: '', plan: '', useCase: '' });
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestKey.mutateAsync(form);
    setShowForm(false);
    setForm({ name: '', product: '', plan: '', useCase: '' });
  };

  return (
    <div className="key-manager-page">
      <div className="km-header">
        <div>
          <h1 className="dev-page-title">My API Keys</h1>
          <p className="dev-page-subtitle">Manage your API credentials and access plans.</p>
        </div>
        <button className="km-new-btn" onClick={() => setShowForm(true)}>
          + Request API Key
        </button>
      </div>

      {showForm && (
        <div className="km-form-card">
          <h2 className="km-form-title">Request New API Key</h2>
          <form className="km-form" onSubmit={handleRequest}>
            <div className="km-field">
              <label>Key Name</label>
              <input
                required
                className="km-input"
                placeholder="e.g. Production Integration"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="km-field">
              <label>API Product</label>
              <select
                required
                className="km-input"
                value={form.product}
                onChange={(e) => setForm((f) => ({ ...f, product: e.target.value, plan: '' }))}
              >
                <option value="">Select a product…</option>
                {products?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="km-field">
              <label>Plan</label>
              <select
                required
                className="km-input"
                value={form.plan}
                onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                disabled={!form.product}
              >
                <option value="">Select a plan…</option>
                {products?.find((p) => p.id === form.product)?.plans.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name} — {pl.requestsPerDay.toLocaleString()} req/day — {pl.price}
                  </option>
                ))}
              </select>
            </div>
            <div className="km-field">
              <label>Use Case</label>
              <textarea
                required
                className="km-input km-textarea"
                placeholder="Describe how you'll use this API…"
                rows={3}
                value={form.useCase}
                onChange={(e) => setForm((f) => ({ ...f, useCase: e.target.value }))}
              />
            </div>
            {requestKey.error && (
              <div className="km-error">{requestKey.error.message}</div>
            )}
            <div className="km-form-actions">
              <button type="button" className="km-cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="km-submit-btn" disabled={requestKey.isPending}>
                {requestKey.isPending ? 'Submitting…' : 'Request Key'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="km-keys-list">
        {isLoading && <div className="dev-page-loading">Loading keys…</div>}
        {keys?.length === 0 && (
          <div className="km-empty">No API keys yet. Request one above to get started.</div>
        )}
        {keys?.map((key) => (
          <div key={key.id} className="km-key-card">
            <div className="km-key-header">
              <div>
                <span className="km-key-name">{key.name}</span>
                <span className={`km-status ${STATUS_STYLE[key.status]}`}>{key.status}</span>
              </div>
              <div className="km-key-meta">
                <span>{key.product}</span>
                <span>·</span>
                <span>{key.plan}</span>
              </div>
            </div>
            <div className="km-key-value">
              <code className="km-key-code">
                {revealed[key.id] ? key.key : '••••••••••••••••••••••••••••••••'}
              </code>
              <button
                className="km-reveal-btn"
                onClick={() => setRevealed((r) => ({ ...r, [key.id]: !r[key.id] }))}
              >
                {revealed[key.id] ? 'Hide' : 'Reveal'}
              </button>
              <button
                className="km-copy-btn"
                onClick={() => navigator.clipboard.writeText(key.key ?? '')}
              >
                Copy
              </button>
            </div>
            <div className="km-key-stats">
              <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
              {key.lastUsedAt && <span>· Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
              <span className="km-usage">
                {key.requestsToday.toLocaleString()} / {key.requestsLimit.toLocaleString()} req today
              </span>
            </div>
            {key.status === 'ACTIVE' && (
              <div className="km-key-actions">
                <button
                  className="km-revoke-btn"
                  onClick={() => revokeKey.mutate(key.id)}
                  disabled={revokeKey.isPending}
                >
                  Revoke
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
