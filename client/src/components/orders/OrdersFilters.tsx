import type { OrderStatus } from '../../types'

const STATUSES: OrderStatus[] = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]

interface OrdersFiltersProps {
  search: string
  status: string
  sortValue: string
  onSearchChange: (value: string) => void
  onStatusChange: (status: string) => void
  onSortChange: (sortValue: string) => void
}

export function OrdersFilters({
  search,
  status,
  sortValue,
  onSearchChange,
  onStatusChange,
  onSortChange,
}: OrdersFiltersProps) {
  return (
    <div className="filters">
      <label className="search-field">
        <span className="visually-hidden">
          Search by customer name or email
        </span>
        <span aria-hidden="true" className="search-icon">
          ⌕
        </span>
        <input
          type="search"
          placeholder="Search name or email..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <label className="filter-field">
        <span>Status</span>
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item.charAt(0) + item.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-field sort-field">
        <span>Sort by</span>
        <select
          value={sortValue}
          onChange={(event) => onSortChange(event.target.value)}
        >
          <option value="createdAt-desc">Newest first</option>
          <option value="createdAt-asc">Oldest first</option>
          <option value="totalAmountCents-desc">Highest amount</option>
          <option value="totalAmountCents-asc">Lowest amount</option>
        </select>
      </label>
    </div>
  )
}
