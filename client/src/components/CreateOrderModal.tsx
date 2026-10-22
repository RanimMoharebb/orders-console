import { useState, useEffect, type FormEvent } from 'react'
import type { CreateOrderInput } from '../types'

type CreateOrderModalProps = {
  token: string
  onClose: () => void
  onOrderCreated: () => void
  onSessionExpired: () => void
}

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function CreateOrderModal({
  token,
  onClose,
  onOrderCreated,
  onSessionExpired,
}: CreateOrderModalProps) {
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])
  
  const [newOrder, setNewOrder] = useState<CreateOrderInput>({
    customerName: '',
    customerEmail: '',
    items: [
      {
        name: '',
        quantity: 1,
        unitPrice: '',
      },
    ],
  })

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token || createLoading) {
      return
    }

    setCreateLoading(true)
    setCreateError('')

    const items = newOrder.items.map((item) => ({
      name: item.name.trim(),
      quantity: Number(item.quantity),
      unitPriceCents: Math.round(Number(item.unitPrice) * 100),
    }))

    const hasInvalidItem = newOrder.items.some((item) => {
      const price = Number(item.unitPrice)

      return (
        !item.name.trim() ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1 ||
        item.unitPrice.trim() === '' ||
        !Number.isFinite(price) ||
        price < 0 ||
        price * 100 > 100_000_000 ||
        Math.abs(price * 100 - Math.round(price * 100)) > 0.000001
      )
    })

    if (
      !newOrder.customerName.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newOrder.customerEmail.trim()) ||
      items.length === 0 ||
      hasInvalidItem
    ) {
      setCreateError('Enter valid customer details and at least one valid item.')
      setCreateLoading(false)
      return
    }

    const idempotencyKey = crypto.randomUUID()

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          customerName: newOrder.customerName.trim(),
          customerEmail: newOrder.customerEmail.trim(),
          items,
        }),
      })

      const result = await response.json()

      if (response.status === 401) {
        onSessionExpired()
        return
      }

      if (!response.ok) {
        const details = Array.isArray(result.details)
          ? result.details
              .map((issue: { field: string; message: string }) =>
                `${issue.field}: ${issue.message}`,
              )
              .join(' ')
          : ''

        throw new Error(
          [result.error ?? 'Failed to create the order.', details]
            .filter(Boolean)
            .join(' '),
        )
      }

      onOrderCreated()
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while creating the order.',
      )
    } finally {
      setCreateLoading(false)
    }
  }

  const calculatedTotal = newOrder.items.reduce((total, item) => {
    const quantity = Number(item.quantity)
    const price = Number(item.unitPrice)

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return total
    }

    return total + quantity * Math.round(price * 100) / 100
  }, 0)

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
    <section className="create-order-panel modal-panel" aria-labelledby="create-order-title">
      <div className="create-order-heading">
        <div>
          <p className="eyebrow">NEW ORDER</p>
          <h2 id="create-order-title">Create order</h2>
          <p>Enter customer details and one or more items.</p>
        </div>
      </div>

      <form onSubmit={handleCreateOrder}>
        <div className="create-order-fields">
          <label className="create-field">
            <span>Customer name</span>
            <input
              type="text"
              maxLength={120}
              required
              value={newOrder.customerName}
              onChange={(event) =>
                setNewOrder((current) => ({
                  ...current,
                  customerName: event.target.value,
                }))
              }
              placeholder="Customer name"
            />
          </label>

          <label className="create-field">
            <span>Customer email</span>
            <input
              type="email"
              maxLength={254}
              required
              value={newOrder.customerEmail}
              onChange={(event) =>
                setNewOrder((current) => ({
                  ...current,
                  customerEmail: event.target.value,
                }))
              }
              placeholder="customer@example.com"
            />
          </label>
        </div>

        <div className="items-heading">
          <h3>Order items</h3>
          <button
            className="secondary-button"
            type="button"
            disabled={newOrder.items.length >= 100 || createLoading}
            onClick={() =>
              setNewOrder((current) => ({
                ...current,
                items: [
                  ...current.items,
                  { name: '', quantity: 1, unitPrice: '' },
                ],
              }))
            }
          >
            + Add item
          </button>
        </div>

        <div className="order-item-list">
          {newOrder.items.map((item, index) => (
            <div className="order-item-row" key={index}>
              <label className="create-field item-name-field">
                <span>Item {index + 1}</span>
                <input
                  type="text"
                  maxLength={120}
                  required
                  value={item.name}
                  disabled={createLoading}
                  onChange={(event) =>
                    setNewOrder((current) => ({
                      ...current,
                      items: current.items.map((existing, itemIndex) =>
                        itemIndex === index
                          ? { ...existing, name: event.target.value }
                          : existing,
                      ),
                    }))
                  }
                  placeholder="Item name"
                />
              </label>

              <label className="create-field quantity-field">
                <span>Quantity</span>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  step={1}
                  required
                  value={item.quantity}
                  disabled={createLoading}
                  onChange={(event) =>
                    setNewOrder((current) => ({
                      ...current,
                      items: current.items.map((existing, itemIndex) =>
                        itemIndex === index
                          ? { ...existing, quantity: Number(event.target.value) }
                          : existing,
                      ),
                    }))
                  }
                />
              </label>

              <label className="create-field price-field">
                <span>Unit price ($)</span>
                <input
                  type="number"
                  min={0}
                  max={1000000}
                  step="0.01"
                  required
                  value={item.unitPrice}
                  disabled={createLoading}
                  onChange={(event) =>
                    setNewOrder((current) => ({
                      ...current,
                      items: current.items.map((existing, itemIndex) =>
                        itemIndex === index
                          ? { ...existing, unitPrice: event.target.value }
                          : existing,
                      ),
                    }))
                  }
                  placeholder="0.00"
                />
              </label>

              <button
                className="remove-item-button"
                type="button"
                aria-label={`Remove item ${index + 1}`}
                disabled={newOrder.items.length <= 1 || createLoading}
                onClick={() =>
                  setNewOrder((current) => ({
                    ...current,
                    items: current.items.filter(
                      (_, itemIndex) => itemIndex !== index,
                    ),
                  }))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="order-total">
          <span>Order total</span>
          <strong>{moneyFormatter.format(calculatedTotal)}</strong>
        </div>

        {createError && (
          <div className="create-error" role="alert">
            {createError}
          </div>
        )}

        <div className="create-order-actions">
          <button
            className="secondary-button"
            type="button"
            disabled={createLoading}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="create-order-button"
            type="submit"
            disabled={createLoading}
          >
            {createLoading ? 'Creating order...' : 'Create order'}
          </button>
        </div>
      </form>
    </section>
    </div>
  )
}
