import { useInvoices } from '../../hooks/useInvoices';
import type { InvoiceStatus } from '../../types';
import './InvoiceList.css';

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  OPEN: 'inv-open',
  PAID: 'inv-paid',
  OVERDUE: 'inv-overdue',
  CANCELLED: 'inv-cancelled',
};

export function InvoiceList() {
  const { data, isLoading, error } = useInvoices();

  if (isLoading) return <div className="page-loading">Loading invoices…</div>;
  if (error) return <div className="page-error">{error.message}</div>;

  return (
    <div className="invoice-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{data?.total ?? 0} invoices</p>
        </div>
      </div>

      <div className="invoice-table-wrap">
        <table className="invoice-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Order #</th>
              <th>Issued</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((inv) => (
              <tr key={inv.id}>
                <td className="inv-num">{inv.invoiceNumber}</td>
                <td className="inv-order">{inv.orderNumber}</td>
                <td>{new Date(inv.issuedAt).toLocaleDateString()}</td>
                <td className={inv.status === 'OVERDUE' ? 'overdue-date' : ''}>
                  {new Date(inv.dueDate).toLocaleDateString()}
                </td>
                <td className="inv-amount">{inv.currency} {inv.totalAmount.toFixed(2)}</td>
                <td>
                  <span className={`inv-badge ${STATUS_STYLE[inv.status]}`}>
                    {inv.status}
                  </span>
                </td>
                <td>
                  {inv.downloadUrl && (
                    <a className="download-link" href={inv.downloadUrl} download>
                      ↓ PDF
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.data.length === 0 && (
          <div className="empty-state">No invoices found.</div>
        )}
      </div>
    </div>
  );
}
