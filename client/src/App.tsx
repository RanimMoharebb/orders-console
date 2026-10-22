
import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'

type Order = {
  id: string
  customerName: string
  customerEmail: string
  status: OrderStatus
  totalAmountCents: number
  createdAt: string
  _count: {
    items: number
  }
}

type OrdersResponse = {
  data: Order[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

const statuses: OrderStatus[] = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function App() {
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [retryCount, setRetryCount] = useState(0)

  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] =
    useState<OrdersResponse['pagination']>({
      page: 1,
      pageSize: 25,
      total: 0,
      totalPages: 0,
    })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')


  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error ?? 'Login failed.')
      }

      const accessToken = result.data?.token

      if (typeof accessToken !== 'string' || !accessToken) {
        throw new Error('The server did not return an access token.')
      }

      setToken(accessToken)
      setPassword('')
      setLoginError('')
    } catch (err) {
      setLoginError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during login.',
      )
    } finally {
      setLoginLoading(false)
    }
  }


  useEffect(() => {

    if (!token) {
      // setLoading(false) 
      // setOrders([]) 
      return
    }

    const controller = new AbortController()
    let ignore = false

    async function loadOrders() {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      })

      if (search.trim()) {
        params.set('search', search.trim())
      }

      if (status) {
        params.set('status', status)
      }

      try {
        const response = await fetch(`/api/orders?${params}`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const result = await response.json()

        if (!response.ok) {
          if (response.status === 401) {
            setLoginError('Your session has expired. Please log in again.')
            setToken(null)
          }
          throw new Error(
            result.error ?? 'Failed to retrieve orders.',
          )
        }

        if (!ignore) {
          const payload = result as OrdersResponse
          setOrders(payload.data)
          setPagination(payload.pagination)
        }
      } catch (err) {
        if (!ignore && !controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : 'An unexpected error occurred.',
          )
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    void loadOrders()

    return () => {
      ignore = true
      controller.abort()
    }
  }, [search, status, sortBy, sortOrder, page, pageSize, retryCount, token])


  function changeSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function changeStatus(value: string) {
    setStatus(value)
    setPage(1)
  }

  function changeSort(value: string) {
    const [field, direction] = value.split('-')
    setSortBy(field)
    setSortOrder(direction)
    setPage(1)
  }

  const firstOrder =
    pagination.total === 0 ? 0 : (page - 1) * pageSize + 1

  const lastOrder = Math.min(page * pageSize, pagination.total)

  if (!token) {
    return (
      <main className="app-shell">
        <header className="topbar">
          <a className="brand" href="/" aria-label="Orders Console home">
            <span className="brand-icon">O</span>
            <span>Orders Console</span>
          </a>
          <span className="environment-label">LOCAL ENVIRONMENT</span>
        </header>

        <section className="login-page">
          <form className="login-card" onSubmit={handleLogin}>
            <p className="eyebrow">OPERATIONS / SECURE ACCESS</p>
            <h1>Welcome back</h1>
            <p className="login-description">
              Sign in to access the orders console.
            </p>

            {loginError && (
              <div className="login-error" role="alert">
                {loginError}
              </div>
            )}

            <label className="login-field">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                required
              />
            </label>

            <label className="login-field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </label>

            <button
              className="login-button"
              type="submit"
              disabled={loginLoading}
            >
              {loginLoading ? 'Signing in...' : 'Sign in'}
            </button>

            <p className="login-footnote">
              Use your seeded administrator account for local testing.
            </p>
          </form>
        </section>
      </main>
    )
  }

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
            onClick={() => {
              setToken(null)
              setPassword('')
              setOrders([])
              setLoginError('')
            }}
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

          <div className="total-card">
            <span>Total orders</span>
            <strong>{pagination.total.toLocaleString()}</strong>
          </div>
        </div>

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

          <div className="filters">
            <label className="search-field">
              <span className="visually-hidden">
                Search by customer name or email
              </span>
              <span aria-hidden="true" className="search-icon">⌕</span>
              <input
                type="search"
                placeholder="Search name or email..."
                value={search}
                onChange={(event) => changeSearch(event.target.value)}
              />
            </label>

            <label className="filter-field">
              <span>Status</span>
              <select
                value={status}
                onChange={(event) => changeStatus(event.target.value)}
              >
                <option value="">All statuses</option>
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item.charAt(0) + item.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </label>

            <label className="filter-field sort-field">
              <span>Sort by</span>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(event) => changeSort(event.target.value)}
              >
                <option value="createdAt-desc">Newest first</option>
                <option value="createdAt-asc">Oldest first</option>
                <option value="totalAmountCents-desc">Highest amount</option>
                <option value="totalAmountCents-asc">Lowest amount</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="error-message" role="alert">
              <strong>Could not load orders.</strong>
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setRetryCount((count) => count + 1)}
              >
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
                        {moneyFormatter.format(
                          order.totalAmountCents / 100,
                        )}
                      </td>
                      <td className="date-cell">
                        {new Date(order.createdAt).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          },
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <footer className="pagination">
            <div className="pagination-info">
              Showing <strong>{firstOrder.toLocaleString()}</strong>–<strong>
                {lastOrder.toLocaleString()}
              </strong>{' '}
              of <strong>{pagination.total.toLocaleString()}</strong> orders
            </div>

            <div className="pagination-controls">
              <label className="page-size-control">
                <span>Rows</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value))
                    setPage(1)
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>

              <button
                type="button"
                className="page-button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>

              <span className="page-number">
                {page.toLocaleString()} / {pagination.totalPages.toLocaleString()}
              </span>

              <button
                type="button"
                className="page-button"
                disabled={page >= pagination.totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </footer>
        </section>

        <p className="footer-note">
          Orders Console <span>·</span> Data served by the local API
        </p>
      </section>
    </main>
  )
}

export default App


