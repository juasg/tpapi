import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Login.css';

const DEMO_ACCOUNTS = [
  { id: '0000100001', name: 'Acme Corp',            secret: 'acme-secret-2026!' },
  { id: '0000100002', name: 'GlobalTech Inc',        secret: 'globaltech-secret-2026!' },
  { id: '0000100003', name: 'RetailMax LLC',         secret: 'retailmax-secret-2026!' },
  { id: '0000100004', name: 'SkyBuild Partners',     secret: 'skybuild-secret-2026!' },
  { id: '0000100005', name: 'PacRim Logistics',      secret: 'pacrim-secret-2026!' },
];

export function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [clientId, setClientId]         = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [destination, setDestination]   = useState<'portal' | 'devportal'>('portal');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(clientId, clientSecret);
      navigate(destination === 'portal' ? '/portal' : '/devportal', { replace: true });
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (id: string, secret: string) => {
    setClientId(id);
    setClientSecret(secret);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-mark">TP</span>
          <span className="login-logo-text">TPAPI</span>
        </div>

        <h1 className="login-title">Sign in</h1>
        <p className="login-subtitle">
          Use your API client credentials to access the portal.
        </p>

        <div className="login-dest-tabs">
          <button
            className={`dest-tab ${destination === 'portal' ? 'active' : ''}`}
            type="button"
            onClick={() => setDestination('portal')}
          >
            Order Portal
          </button>
          <button
            className={`dest-tab ${destination === 'devportal' ? 'active' : ''}`}
            type="button"
            onClick={() => setDestination('devportal')}
          >
            Dev Portal
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Client ID</label>
            <input
              required
              className="login-input"
              placeholder="e.g. 0000100001"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="login-field">
            <label>Client Secret</label>
            <input
              required
              type="password"
              className="login-input"
              placeholder="••••••••••••••••"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <div className="login-demo">
          <div className="login-demo-label">Demo accounts</div>
          <div className="login-demo-grid">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.id}
                type="button"
                className="demo-chip"
                onClick={() => fillDemo(a.id, a.secret)}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
