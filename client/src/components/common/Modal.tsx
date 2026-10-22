import { useEffect, type ReactNode } from 'react'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  titleId?: string
  descriptionId?: string
  role?: 'dialog' | 'alertdialog'
  className?: string
  children: ReactNode
}

export function Modal({
  isOpen,
  onClose,
  titleId,
  descriptionId,
  role = 'dialog',
  className = '',
  children,
}: ModalProps) {
  useBodyScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className={`modal-panel ${className}`.trim()}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        {children}
      </div>
    </div>
  )
}
