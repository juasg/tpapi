import { useState } from 'react';
import { useApiProducts } from '../../hooks/useDevPortal';
import { apiClient } from '../../api/client';
import './Playground.css';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

export function Playground() {
  const { data: products } = useApiProducts();
  const [method, setMethod] = useState<typeof HTTP_METHODS[number]>('GET');
  const [path, setPath] = useState('/products');
  const [body, setBody] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [response, setResponse] = useState<{ status: number; data: unknown } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState<number | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    const start = Date.now();
    try {
      let parsedBody: unknown;
      if (body.trim()) {
        try { parsedBody = JSON.parse(body); } catch { throw new Error('Request body is not valid JSON'); }
      }
      const res = await apiClient.request({
        method,
        url: path,
        data: parsedBody,
        headers: apiKey ? { 'x-api-key': apiKey } : {},
      });
      setElapsed(Date.now() - start);
      setResponse({ status: res.status, data: res.data });
    } catch (err: unknown) {
      setElapsed(Date.now() - start);
      const axiosErr = err as { response?: { status: number; data: unknown }; message: string };
      if (axiosErr.response) {
        setResponse({ status: axiosErr.response.status, data: axiosErr.response.data });
      } else {
        setError(axiosErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: number) =>
    s < 300 ? '#3fb950' : s < 400 ? '#e3b341' : '#f85149';

  return (
    <div className="playground-page">
      <h1 className="dev-page-title">API Playground</h1>
      <p className="dev-page-subtitle">
        Test API calls live against the sandbox environment. Use your API key for authenticated endpoints.
      </p>

      <div className="playground-layout">
        <aside className="playground-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Quick endpoints</div>
            {products?.flatMap((p) =>
              p.endpoints.map((ep) => ({
                label: `${p.name}: ${ep}`,
                method: ep.startsWith('POST') ? 'POST' : 'GET',
                path: ep.replace(/^(GET|POST|PUT|DELETE)\s+/, ''),
              }))
            ).map((item, i) => (
              <button
                key={i}
                className="sidebar-ep"
                onClick={() => { setMethod(item.method as typeof HTTP_METHODS[number]); setPath(item.path); }}
              >
                <span className={`ep-method ep-${item.method}`}>{item.method}</span>
                <span className="ep-path">{item.path}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="playground-main">
          <div className="request-bar">
            <select
              className="method-select"
              value={method}
              onChange={(e) => setMethod(e.target.value as typeof HTTP_METHODS[number])}
            >
              {HTTP_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
            <input
              className="path-input"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/products"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="send-btn" onClick={handleSend} disabled={loading}>
              {loading ? '…' : 'Send'}
            </button>
          </div>

          <div className="playground-fields">
            <div className="pg-field">
              <label className="pg-label">API Key (optional)</label>
              <input
                className="pg-input"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="tpapi_…"
              />
            </div>
            {['POST', 'PUT', 'PATCH'].includes(method) && (
              <div className="pg-field">
                <label className="pg-label">Request Body (JSON)</label>
                <textarea
                  className="pg-input pg-textarea pg-code"
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={'{\n  "key": "value"\n}'}
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {error && <div className="pg-error">{error}</div>}

          {response && (
            <div className="response-panel">
              <div className="response-header">
                <span className="response-status" style={{ color: statusColor(response.status) }}>
                  {response.status}
                </span>
                {elapsed !== null && (
                  <span className="response-time">{elapsed}ms</span>
                )}
              </div>
              <pre className="response-body">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
