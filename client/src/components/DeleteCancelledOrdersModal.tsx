import { useState } from 'react'
import { request, ApiError } from '../api/apiClient'
import type { ApiResponse, DeleteCancelledOrdersModalProps } from '../types'
import { Modal } from './common/Modal'

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
      const result = await request<ApiResponse>('/api/orders/cancelled', {
        method: 'DELETE',
        token,
        onUnauthorized: onSessionExpired,
      })

      onDeleted(result.deletedCount ?? 0)
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'An unexpected error occurred.',
      )
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={() => {
        if (!deleteLoading) {
          onClose()
        }
      }}
      role="alertdialog"
      titleId="delete-confirmation-title"
      descriptionId="delete-confirmation-description"
      className="delete-confirmation-panel"
    >
      <div className="delete-confirmation-icon" aria-hidden="true">
        !
      </div>

      <h2 id="delete-confirmation-title">Delete cancelled orders?</h2>

      <p id="delete-confirmation-description">
        This will permanently delete all cancelled orders from the database.
        This action cannot be undone.
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
    </Modal>
  )
}
