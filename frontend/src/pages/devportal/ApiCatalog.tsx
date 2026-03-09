import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiProducts } from '../../hooks/useDevPortal';
import './ApiCatalog.css';

const TAG_COLORS: Record<string, string> = {
  orders: '#0a6ed1',
  invoices: '#6f42c1',
  shipments: '#20884a',
  products: '#c05000',
  customers: '#bb0000',
};

export function ApiCatalog() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { data: products, isLoading, error } = useApiProducts();

  const filtered = products?.filter((p) =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="dev-page-loading">Loading API catalog…</div>;
  if (error) return <div className="dev-page-error">{error.message}</div>;

  return (
    <div className="api-catalog-page">
      <div className="catalog-hero">
        <h1 className="dev-page-title">API Catalog</h1>
        <p className="dev-page-subtitle">
          Browse and integrate with TPAPI's B2B order-to-cash APIs.
          Authenticate with OAuth2 or API keys to get started.
        </p>
        <input
          type="text"
          className="dev-search"
          placeholder="Search APIs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="api-grid">
        {filtered?.map((product) => (
          <div
            key={product.id}
            className="api-card"
            onClick={() => navigate(`/devportal/apis/${product.id}`)}
          >
            <div className="api-card-header">
              <h2 className="api-name">{product.name}</h2>
              <span className="api-version">v{product.version}</span>
            </div>
            <p className="api-desc">{product.description}</p>
            <div className="api-endpoints">
              {product.endpoints.slice(0, 3).map((ep, i) => (
                <code key={i} className="endpoint-pill">{ep}</code>
              ))}
              {product.endpoints.length > 3 && (
                <span className="endpoint-more">+{product.endpoints.length - 3} more</span>
              )}
            </div>
            <div className="api-footer">
              <div className="api-tags">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="api-tag"
                    style={{ background: `${TAG_COLORS[tag] ?? '#6e7e8e'}22`, color: TAG_COLORS[tag] ?? '#6e7e8e' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="api-plans">{product.plans.length} plan{product.plans.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
