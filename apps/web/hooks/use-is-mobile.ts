import { useCallback, useState, useEffect } from 'react'

interface MediaQueryResult {
  matches: boolean
  addEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => void
  removeEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => void
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void
}

export function useIsMobile(mobileScreenSize = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }
    return window.matchMedia(`(max-width: ${mobileScreenSize}px)`).matches
  })

  const checkIsMobile = useCallback((event: MediaQueryListEvent) => {
    setIsMobile(event.matches)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaListener: MediaQueryResult = window.matchMedia(`(max-width: ${mobileScreenSize}px)`)

    const attachListener = () => {
      if (mediaListener.addEventListener) {
        mediaListener.addEventListener('change', checkIsMobile)
      } else if (mediaListener.addListener) {
        mediaListener.addListener(checkIsMobile)
      }
    }

    const removeListener = () => {
      if (mediaListener.removeEventListener) {
        mediaListener.removeEventListener('change', checkIsMobile)
      } else if (mediaListener.removeListener) {
        mediaListener.removeListener(checkIsMobile)
      }
    }

    attachListener()
    return removeListener
  }, [mobileScreenSize, checkIsMobile])

  return isMobile
}
