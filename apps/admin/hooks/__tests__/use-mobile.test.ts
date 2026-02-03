import { renderHook, waitFor } from '@testing-library/react'

import { useIsMobile } from '../use-mobile'

// ---------------------------------------------------------------------------
// useIsMobile
// ---------------------------------------------------------------------------

describe('useIsMobile', () => {
  beforeEach(() => {
    // Reset window.innerWidth before each test
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  it('returns false when window width is greater than mobile breakpoint', async () => {
    // Set desktop width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())

    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })

  it('returns true when window width is less than mobile breakpoint', async () => {
    // Set mobile width (breakpoint is 768)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    const { result } = renderHook(() => useIsMobile())

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('returns true when window width equals 767 (just below breakpoint)', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 767,
    })

    const { result } = renderHook(() => useIsMobile())

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('returns false when window width equals 768 (at breakpoint)', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })

    const { result } = renderHook(() => useIsMobile())

    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })
})
