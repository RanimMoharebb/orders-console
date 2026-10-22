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
