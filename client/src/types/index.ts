export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'

export type UserRole = 'ADMIN' | 'AGENT'

export interface OrderItemCount {
  items: number
}

export interface Order {
  id: string
  customerName: string
  customerEmail: string
  status: OrderStatus
  totalAmountCents: number
  createdAt: string
  _count: OrderItemCount
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface OrdersResponse {
  data: Order[]
  pagination: PaginationMeta
}

export interface OrderItemInput {
  name: string
  quantity: number
  unitPrice: string
}

export interface CreateOrderItemPayload {
  name: string
  quantity: number
  unitPriceCents: number
}

export interface CreateOrderInput {
  customerName: string
  customerEmail: string
  items: OrderItemInput[]
}

export interface CreateOrderPayload {
  customerName: string
  customerEmail: string
  items: CreateOrderItemPayload[]
}

export interface AuthSession {
  token: string
  role: UserRole
}

export interface LoginResponseUser {
  id: string
  email: string
  role: UserRole
}

export interface LoginResponseData {
  token: string
  user: LoginResponseUser
}

export interface ApiValidationErrorDetail {
  field: string
  message: string
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  details?: ApiValidationErrorDetail[]
  deletedCount?: number
}

export interface LoginProps {
  onLoginSuccess: (token: string, role: UserRole) => void
}

export interface DashboardProps {
  token: string
  role: UserRole
  onLogout: () => void
}

export interface CreateOrderModalProps {
  token: string
  onClose: () => void
  onOrderCreated: () => void
  onSessionExpired: () => void
}

export interface DeleteCancelledOrdersModalProps {
  token: string
  onClose: () => void
  onDeleted: (count: number) => void
  onSessionExpired: () => void
}
