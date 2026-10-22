import { useState } from 'react'
import type { DeleteCancelledOrdersModalProps } from '../types'


export function DeleteCancelledOrdersModal({
  token,
  onClose,
  onDeleted,
  onSessionExpired,
}: DeleteCancelledOrdersModalProps) {
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setDeleteLoading(true)
    setError('')

    try {
      const response = await fetch('/api/orders/cancelled', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (response.status === 401) {
        onSessionExpired()
        return
      }

      if (!response.ok) {
        throw new Error(
          result.error ?? 'Failed to delete cancelled orders.',
        )
      }

      onDeleted(result.deletedCount)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred.',
      )
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !deleteLoading
        ) {
          onClose()
        }
      }}
    >
      <section
        className="modal-panel delete-confirmation-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-confirmation-title"
        aria-describedby="delete-confirmation-description"
      >
        <div className="delete-confirmation-icon" aria-hidden="true">
          !
        </div>

        <h2 id="delete-confirmation-title">
          Delete cancelled orders?
        </h2>

        <p id="delete-confirmation-description">
          This will permanently delete all cancelled orders from the
          database. This action cannot be undone.
        </p>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <div className="delete-confirmation-actions">
          <button
            type="button"
            className="delete-cancel-button"
            disabled={deleteLoading}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="delete-confirm-button"
            disabled={deleteLoading}
            onClick={() => void handleDelete()}
          >
            {deleteLoading ? 'Deleting...' : 'Delete permanently'}
          </button>
        </div>
      </section>
    </div>
  )
}
