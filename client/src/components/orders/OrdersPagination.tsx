import type { PaginationMeta } from '../../types'

interface OrdersPaginationProps {
  pagination: PaginationMeta
  page: number
  pageSize: number
  loading: boolean
  onPageChange: (newPage: number) => void
  onPageSizeChange: (newPageSize: number) => void
}

export function OrdersPagination({
  pagination,
  page,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange,
}: OrdersPaginationProps) {
  const firstOrder =
    pagination.total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastOrder = Math.min(page * pageSize, pagination.total)

  return (
    <footer className="pagination">
      <div className="pagination-info">
        Showing <strong>{firstOrder.toLocaleString()}</strong>–
        <strong>{lastOrder.toLocaleString()}</strong> of{' '}
        <strong>{pagination.total.toLocaleString()}</strong> orders
      </div>

      <div className="pagination-controls">
        <label className="page-size-control">
          <span>Rows</span>

          <select
            value={pageSize}
            disabled={loading}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
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
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>

        <span className="page-number">
          {page.toLocaleString()} /{' '}
          {Math.max(1, pagination.totalPages).toLocaleString()}
        </span>

        <button
          type="button"
          className="page-button"
          disabled={page >= pagination.totalPages || loading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </footer>
  )
}
