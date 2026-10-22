import { useCallback, useEffect, useState } from 'react'
import { request, ApiError } from '../api/apiClient'
import type { Order, OrdersResponse, PaginationMeta } from '../types'
import { useDebounce } from './useDebounce'

interface UseOrdersOptions {
  token: string
  onUnauthorized: () => void
}

export function useOrders({ token, onUnauthorized }: UseOrdersOptions) {
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    setPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    setPage(1)
  }

  const handleSortChange = (combinedSortValue: string) => {
    const [field, direction] = combinedSortValue.split('-')
    setSortBy(field)
    setSortOrder(direction)
    setPage(1)
  }

  const reload = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function fetchOrders() {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      })

      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim())
      }

      if (status) {
        params.set('status', status)
      }

      try {
        const result = await request<OrdersResponse>(`/api/orders?${params.toString()}`, {
          token,
          signal: controller.signal,
          onUnauthorized,
        })

        setOrders(result.data)
        setPagination(result.pagination)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof ApiError ? err.message : 'An unexpected error occurred.',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void fetchOrders()

    return () => {
      controller.abort()
    }
  }, [
    debouncedSearch,
    status,
    sortBy,
    sortOrder,
    page,
    pageSize,
    refreshTrigger,
    token,
    onUnauthorized,
  ])

  return {
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
    setSearchInput: handleSearchChange,
    setStatus: handleStatusChange,
    setSort: handleSortChange,
    setPage,
    setPageSize,
    reload,
  }
}
