import { useState, useEffect, useMemo } from 'react'

export function useIsMobile(mobileScreenSize = 768) {
  // Start with null to avoid hydration mismatch
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  // Memoize the media query string to prevent unnecessary effect re-runs
  const mediaQuery = useMemo(() => `(max-width: ${mobileScreenSize}px)`, [mobileScreenSize])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaListener = window.matchMedia(mediaQuery)

    // Set initial state
    setIsMobile(mediaListener.matches)

    // Create stable listener function
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }

    // Add listener
    mediaListener.addEventListener('change', handleChange)

    // Cleanup
    return () => {
      mediaListener.removeEventListener('change', handleChange)
    }
  }, [mediaQuery])

  // Return undefined during SSR/hydration to prevent mismatch
  return isMobile
}
