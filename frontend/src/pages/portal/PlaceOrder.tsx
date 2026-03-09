import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { useCreateOrder } from '../../hooks/useOrders';
import './PlaceOrder.css';

export function PlaceOrder() {
  const { state } = useLocation() as { state?: { cart?: Record<string, number> } };
  const navigate = useNavigate();
  const { data: productData } = useProducts();
  const createOrder = useCreateOrder();

  const [cart, setCart] = useState<Record<string, number>>(state?.cart ?? {});
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');

  const products = productData?.data ?? [];
  const cartItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ product: products.find((p) => p.id === id), qty }))
    .filter((item) => item.product);

  const total = cartItems.reduce(
    (sum, { product, qty }) => sum + (product!.price * qty), 0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const order = await createOrder.mutateAsync({
        items: cartItems.map(({ product, qty }) => ({
          productId: product!.id,
          quantity: qty,
        })),
        deliveryDate: deliveryDate || undefined,
        notes: notes || undefined,
      });
      navigate(`/portal/orders/${order.id}`, { replace: true });
    } catch {
      // error shown inline
    }
  };

  return (
    <div className="place-order-page">
      <div className="detail-breadcrumb">
        <button className="back-btn" onClick={() => navigate('/portal/catalog')}>← Catalog</button>
      </div>
      <h1 className="page-title">Place Order</h1>

      <form className="order-form" onSubmit={handleSubmit}>
        <section className="order-card">
          <h2 className="card-title">Order Summary</h2>
          {cartItems.length === 0 ? (
            <p className="empty-cart">
              No items in cart. <button type="button" className="link-btn" onClick={() => navigate('/portal/catalog')}>Add products</button>
            </p>
          ) : (
            <table className="cart-table">
              <thead>
                <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th><th></th></tr>
              </thead>
              <tbody>
                {cartItems.map(({ product, qty }) => (
                  <tr key={product!.id}>
                    <td>{product!.name}</td>
                    <td>
                      <div className="qty-ctrl">
                        <button type="button" className="qty-btn"
                          onClick={() => setCart(c => ({ ...c, [product!.id]: Math.max(0, c[product!.id] - 1) }))}>−</button>
                        <span>{qty}</span>
                        <button type="button" className="qty-btn"
                          onClick={() => setCart(c => ({ ...c, [product!.id]: c[product!.id] + 1 }))}>+</button>
                      </div>
                    </td>
                    <td>{product!.currency} {product!.price.toFixed(2)}</td>
                    <td className="item-total">{product!.currency} {(product!.price * qty).toFixed(2)}</td>
                    <td>
                      <button type="button" className="remove-btn"
                        onClick={() => setCart(c => { const n = {...c}; delete n[product!.id]; return n; })}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="total-label">Order Total</td>
                  <td className="order-grand-total">
                    {cartItems[0]?.product?.currency} {total.toFixed(2)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </section>

        <section className="order-card">
          <h2 className="card-title">Delivery Details</h2>
          <div className="form-row">
            <label className="form-label">Requested Delivery Date</label>
            <input
              type="date"
              className="form-input"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="form-row">
            <label className="form-label">Notes (optional)</label>
            <textarea
              className="form-input form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions, reference numbers…"
              rows={3}
            />
          </div>
        </section>

        {createOrder.error && (
          <div className="form-error">{createOrder.error.message}</div>
        )}

        <div className="form-actions">
          <button type="button" className="secondary-btn" onClick={() => navigate('/portal/catalog')}>
            Cancel
          </button>
          <button
            type="submit"
            className="primary-btn"
            disabled={cartItems.length === 0 || createOrder.isPending}
          >
            {createOrder.isPending ? 'Submitting…' : 'Submit Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
