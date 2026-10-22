import { useEffect } from 'react'

let activeLocksCount = 0
let originalOverflow = ''

export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return

    if (activeLocksCount === 0) {
      originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    activeLocksCount++

    return () => {
      activeLocksCount--
      if (activeLocksCount <= 0) {
        document.body.style.overflow = originalOverflow
        activeLocksCount = 0
      }
    }
  }, [isLocked])
}
