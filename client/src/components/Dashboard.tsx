import { useEffect, useState } from 'react'
import type { DashboardProps } from '../types'
import { useOrders } from '../hooks/useOrders'
import { OrdersFilters } from './orders/OrdersFilters'
import { OrdersTable } from './orders/OrdersTable'
import { OrdersPagination } from './orders/OrdersPagination'
import { CreateOrderModal } from './CreateOrderModal'
import { DeleteCancelledOrdersModal } from './DeleteCancelledOrdersModal'

export function Dashboard({ token, role, onLogout }: DashboardProps) {
  const {
    orders,
    pagination,
    loading,
    error,
    searchInput,
    status,
    sortBy,
    sortOrder,
    page,
    pageSize,
    setSearchInput,
    setStatus,
    setSort,
    setPage,
    setPageSize,
    reload,
  } = useOrders({ token, onUnauthorized: onLogout })

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  // Auto-dismiss feedback message after 2.5 seconds
  useEffect(() => {
    if (!feedbackMessage) return

    const timer = window.setTimeout(() => {
      setFeedbackMessage(null)
    }, 2500)

    return () => {
      window.clearTimeout(timer)
    }
  }, [feedbackMessage])

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Orders Console home">
          <span className="brand-icon">O</span>
          <span>Orders Console</span>
        </a>

        <div className="topbar-actions">
          <span className="environment-label">LOCAL ENVIRONMENT</span>

          <button
            className="logout-button"
            type="button"
            onClick={onLogout}
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="page-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">OPERATIONS / ORDERS</p>
            <h1>Orders</h1>
            <p className="page-description">
              Search, review, and manage customer orders.
            </p>
          </div>

          <div className="heading-actions">
            <div className="total-card">
              <span>Total orders</span>
              <strong>{pagination.total.toLocaleString()}</strong>
            </div>

            {role === 'ADMIN' && (
              <button
                className="delete-cancelled-button"
                type="button"
                onClick={() => {
                  setFeedbackMessage(null)
                  setShowDeleteConfirmation(true)
                }}
              >
                Delete Cancelled Orders
              </button>
            )}

            <button
              className="create-order-button"
              type="button"
              onClick={() => {
                setShowCreateForm((visible) => !visible)
                setFeedbackMessage(null)
              }}
            >
              {showCreateForm ? 'Cancel' : '+ Create order'}
            </button>
          </div>
        </div>

        {feedbackMessage && (
          <div className="create-success" role="status">
            {feedbackMessage}
          </div>
        )}

        <section className="orders-panel" aria-label="Orders list">
          <div className="panel-heading">
            <div>
              <h2>All orders</h2>
              <p>Browse and filter your order records.</p>
            </div>

            <span className="record-count">
              {pagination.total.toLocaleString()} records
            </span>
          </div>

          <OrdersFilters
            search={searchInput}
            status={status}
            sortValue={`${sortBy}-${sortOrder}`}
            onSearchChange={setSearchInput}
            onStatusChange={setStatus}
            onSortChange={setSort}
          />

          <OrdersTable
            orders={orders}
            loading={loading}
            error={error}
            onRetry={reload}
          />

          <OrdersPagination
            pagination={pagination}
            page={page}
            pageSize={pageSize}
            loading={loading}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setPage(1)
            }}
          />
        </section>

        <p className="footer-note">
          Orders Console <span>·</span> Data served by the local API
        </p>
      </section>

      {showCreateForm && (
        <CreateOrderModal
          token={token}
          onClose={() => setShowCreateForm(false)}
          onOrderCreated={() => {
            setShowCreateForm(false)
            setFeedbackMessage('Order created successfully.')
            reload()
          }}
          onSessionExpired={onLogout}
        />
      )}

      {showDeleteConfirmation && (
        <DeleteCancelledOrdersModal
          token={token}
          onClose={() => setShowDeleteConfirmation(false)}
          onSessionExpired={onLogout}
          onDeleted={(count) => {
            setShowDeleteConfirmation(false)
            setFeedbackMessage(
              `Successfully deleted ${count} cancelled order${count === 1 ? '' : 's'}.`,
            )
            reload()
          }}
        />
      )}
    </main>
  )
}
