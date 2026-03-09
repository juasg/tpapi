import { useParams, useNavigate } from 'react-router-dom';
import { useOrder } from '../../hooks/useOrders';
import { useShipment } from '../../hooks/useShipments';
import './OrderDetail.css';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, error } = useOrder(id!);
  const { data: shipment } = useShipment(id!);

  if (isLoading) return <div className="page-loading">Loading order…</div>;
  if (error || !order) return <div className="page-error">Order not found.</div>;

  return (
    <div className="order-detail-page">
      <div className="detail-breadcrumb">
        <button className="back-btn" onClick={() => navigate('/portal/orders')}>← Orders</button>
      </div>

      <div className="detail-header">
        <div>
          <h1 className="page-title">Order {order.orderNumber}</h1>
          <p className="page-subtitle">Placed {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <span className={`status-badge status-${order.status.toLowerCase().replace('_','-')}`}>
          {order.status.replace('_', ' ')}
        </span>
      </div>

      <div className="detail-grid">
        <section className="detail-card">
          <h2 className="card-title">Order Items</h2>
          <table className="items-table">
            <thead>
              <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.productName}</td>
                  <td>{item.quantity} {item.unit}</td>
                  <td>{order.currency} {item.unitPrice.toFixed(2)}</td>
                  <td className="item-total">{order.currency} {item.totalPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="total-label">Order Total</td>
                <td className="order-grand-total">
                  {order.currency} {order.totalAmount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        {shipment && (
          <section className="detail-card">
            <h2 className="card-title">Shipment Tracking</h2>
            <div className="shipment-meta">
              <span>Carrier: <strong>{shipment.carrier}</strong></span>
              <span>Tracking: <strong>{shipment.trackingNumber}</strong></span>
              <span>Est. Delivery: <strong>{new Date(shipment.estimatedDelivery).toLocaleDateString()}</strong></span>
            </div>
            <div className="shipment-timeline">
              {shipment.events.map((ev, i) => (
                <div key={i} className="timeline-event">
                  <div className="timeline-dot" />
                  <div className="timeline-body">
                    <div className="timeline-status">{ev.status.replace('_', ' ')}</div>
                    <div className="timeline-desc">{ev.description}</div>
                    <div className="timeline-meta">{ev.location} · {new Date(ev.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
