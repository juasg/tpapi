import { useState } from 'react';
import { useAdminOrders } from '../../hooks/useAdmin';
import './AdminOrders.css';

const STATUS_CLASS: Record<string, string> = {
  SUBMITTED:   'badge badge--blue',
  CONFIRMED:   'badge badge--purple',
  IN_DELIVERY: 'badge badge--yellow',
  DELIVERED:   'badge badge--green',
  CANCELLED:   'badge badge--red',
  DRAFT:       'badge badge--gray',
};

const ALL_STATUSES = ['DRAFT','SUBMITTED','CONFIRMED','IN_DELIVERY','DELIVERED','CANCELLED'];

export function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');

  const { data, isLoading, error } = useAdminOrders({
    status:     statusFilter     || undefined,
    customerId: customerFilter   || undefined,
  });

  return (
    <div className="adm-orders">
      <div className="adm-page-header">
        <h1 className="adm-page-title">Orders</h1>
        <p className="adm-page-sub">All orders across all customers</p>
      </div>

      <div className="adm-filters">
        <input
          className="adm-filter-input"
          placeholder="Filter by Customer ID…"
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
        />
        <select
          className="adm-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="adm-result-count">
          {data ? `${data.total} order${data.total !== 1 ? 's' : ''}` : ''}
        </span>
      </div>

      {isLoading && <div className="adm-loading">Loading orders…</div>}
      {error     && <div className="adm-error">Failed to load orders: {error.message}</div>}

      {data && data.data.length === 0 && (
        <div className="adm-empty">No orders found.</div>
      )}

      {data && data.data.length > 0 && (
        <table className="adm-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Delivery</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((o) => (
              <tr key={o.id}>
                <td><code>{o.orderNumber}</code></td>
                <td><code>{o.customerId}</code></td>
                <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</td>
                <td>{o.itemCount}</td>
                <td className="adm-amount">
                  {o.currency} {o.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td>{o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString() : '—'}</td>
                <td>
                  <span className={STATUS_CLASS[o.status] ?? 'badge badge--gray'}>
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
