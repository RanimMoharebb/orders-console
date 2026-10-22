import type { Order } from '../../types'
import { formatCurrency, formatDate } from '../../utils/formatters'

interface OrdersTableProps {
  orders: Order[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function OrdersTable({
  orders,
  loading,
  error,
  onRetry,
}: OrdersTableProps) {
  return (
    <>
      {error && (
        <div className="error-message" role="alert">
          <strong>Could not load orders.</strong>
          <span>{error}</span>

          <button type="button" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Order ID</th>
              <th>Status</th>
              <th>Items</th>
              <th>Total</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="table-message">
                  Loading orders...
                </td>
              </tr>
            )}

            {!loading && !error && orders.length === 0 && (
              <tr>
                <td colSpan={6} className="table-message">
                  No orders found. Try changing your search or filters.
                </td>
              </tr>
            )}

            {!loading &&
              orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div className="customer-cell">
                      <span className="avatar">
                        {order.customerName.charAt(0).toUpperCase()}
                      </span>

                      <span className="customer-details">
                        <strong>{order.customerName}</strong>
                        <span>{order.customerEmail}</span>
                      </span>
                    </div>
                  </td>

                  <td>
                    <code className="order-id">
                      {order.id.slice(0, 8)}
                    </code>
                  </td>

                  <td>
                    <span
                      className={`status-badge status-${order.status.toLowerCase()}`}
                    >
                      <span className="status-dot" />

                      {order.status.charAt(0) +
                        order.status.slice(1).toLowerCase()}
                    </span>
                  </td>

                  <td>{order._count.items}</td>

                  <td className="amount">
                    {formatCurrency(order.totalAmountCents / 100)}
                  </td>

                  <td className="date-cell">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
