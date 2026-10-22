export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'

export type Order = {
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

export type LoginProps = {
  onLoginSuccess: (token: string, role: UserRole) => void
}

export type OrdersResponse = {
  data: Order[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type OrderItemInput = {
  name: string
  quantity: number
  unitPrice: string
}

export type CreateOrderInput = {
  customerName: string
  customerEmail: string
  items: OrderItemInput[]
}

export type CreateOrderModalProps = {
  token: string
  onClose: () => void
  onOrderCreated: () => void
  onSessionExpired: () => void
}

export type UserRole = 'ADMIN' | 'AGENT'

export type AuthSession = {
  token: string
  role: UserRole
}
export type DashboardProps = {
  token: string
  role: UserRole
  onLogout: () => void
}

export type DeleteCancelledOrdersModalProps = {
  token: string
  onClose: () => void
  onDeleted: (count: number) => void
  onSessionExpired: () => void
}
