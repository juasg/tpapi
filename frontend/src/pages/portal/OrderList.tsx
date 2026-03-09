import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../hooks/useOrders';
import type { OrderStatus } from '../../types';
import './OrderList.css';

const STATUS_COLORS: Record<OrderStatus, string> = {
  DRAFT: 'status-draft',
  SUBMITTED: 'status-submitted',
  CONFIRMED: 'status-confirmed',
  IN_DELIVERY: 'status-in-delivery',
  DELIVERED: 'status-delivered',
  CANCELLED: 'status-cancelled',
};

export function OrderList() {
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const { data, isLoading, error } = useOrders({ status: status || undefined });

  if (isLoading) return <div className="page-loading">Loading orders…</div>;
  if (error) return <div className="page-error">{error.message}</div>;

  return (
    <div className="order-list-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{data?.total ?? 0} total orders</p>
        </div>
        <div className="header-actions">
          <select
            className="filter-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {(['SUBMITTED','CONFIRMED','IN_DELIVERY','DELIVERED','CANCELLED'] as OrderStatus[]).map((s) => (
              <option key={s} value={s}>{s.replace('_',' ')}</option>
            ))}
          </select>
          <button className="primary-btn" onClick={() => navigate('/portal/catalog')}>
            + New Order
          </button>
        </div>
      </div>

      <div className="orders-table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((order) => (
              <tr key={order.id} onClick={() => navigate(`/portal/orders/${order.id}`)}>
                <td className="order-num">{order.orderNumber}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                <td className="order-total">
                  {order.currency} {order.totalAmount.toFixed(2)}
                </td>
                <td>
                  <span className={`status-badge ${STATUS_COLORS[order.status]}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <button className="row-action">View →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.data.length === 0 && (
          <div className="empty-state">No orders found.</div>
        )}
      </div>
    </div>
  );
}
