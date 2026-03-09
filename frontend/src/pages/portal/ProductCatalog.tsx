import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { getProductImageUrl } from '../../utils/productImage';
import './ProductCatalog.css';

export function ProductCatalog() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  const { data, isLoading, error } = useProducts({ search: search || undefined });

  const updateCart = (id: string, qty: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, qty) }));

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  if (isLoading) return <div className="page-loading">Loading products…</div>;
  if (error) return <div className="page-error">Failed to load products: {error.message}</div>;

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <div>
          <h1 className="page-title">Product Catalog</h1>
          <p className="page-subtitle">{data?.total ?? 0} products available</p>
        </div>
        <div className="catalog-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          {cartCount > 0 && (
            <button
              className="cart-btn"
              onClick={() => navigate('/portal/orders/new', { state: { cart } })}
            >
              Place Order ({cartCount} item{cartCount !== 1 ? 's' : ''})
            </button>
          )}
        </div>
      </div>

      <div className="product-grid">
        {data?.data.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-img-wrap">
              <img
                src={getProductImageUrl(product)}
                alt={product.name}
                className="product-img"
                loading="lazy"
                onError={(e) => {
                  const seed = product.id.charCodeAt(0) % 1000;
                  (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${seed}/400/240`;
                }}
              />
            </div>
            <div className="product-category">{product.category}</div>
            <h3 className="product-name">{product.name}</h3>
            <p className="product-desc">{product.description}</p>
            <div className="product-footer">
              <div className="product-price">
                {product.currency} {product.price.toFixed(2)}
                <span className="product-unit"> / {product.unit}</span>
              </div>
              <div className="product-qty">
                <button
                  className="qty-btn"
                  onClick={() => updateCart(product.id, (cart[product.id] ?? 0) - 1)}
                >−</button>
                <span className="qty-value">{cart[product.id] ?? 0}</span>
                <button
                  className="qty-btn"
                  onClick={() => updateCart(product.id, (cart[product.id] ?? 0) + 1)}
                >+</button>
              </div>
            </div>
            {!product.available && (
              <div className="product-unavailable">Out of stock</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
