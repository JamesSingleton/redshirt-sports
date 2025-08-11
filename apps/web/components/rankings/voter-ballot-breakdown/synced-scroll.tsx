'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@workspace/ui/lib/utils'

type Props = React.HTMLAttributes<HTMLDivElement> & {
  group: string
}

// Module-level stores to keep groups in sync across component instances.
const groupMap = new Map<string, Set<HTMLElement>>()
const rafMap = new Map<string, number>()
const syncing = new WeakSet<HTMLElement>()

function getGroup(id: string) {
  let set = groupMap.get(id)
  if (!set) {
    set = new Set<HTMLElement>()
    groupMap.set(id, set)
  }
  return set
}

export function SyncedScroll({ group, className, children, ...rest }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const groupSet = getGroup(group)
    groupSet.add(el)

    const onScroll = (e: Event) => {
      const src = e.currentTarget as HTMLElement

      // Ignore programmatic updates we trigger to avoid infinite loops.
      if (syncing.has(src)) {
        syncing.delete(src)
        return
      }

      const max = src.scrollWidth - src.clientWidth
      const ratio = max > 0 ? src.scrollLeft / max : 0

      const prev = rafMap.get(group)
      if (prev !== undefined) cancelAnimationFrame(prev)

      const raf = requestAnimationFrame(() => {
        groupSet.forEach((other) => {
          if (other === src) return
          const otherMax = other.scrollWidth - other.clientWidth
          const target = Math.round(ratio * otherMax)
          if (Math.abs(other.scrollLeft - target) > 1) {
            syncing.add(other)
            other.scrollLeft = target
          }
        })
      })
      rafMap.set(group, raf)
    }

    el.addEventListener('scroll', onScroll, { passive: true })

    // Optional: Add ResizeObserver if you need to handle dynamic content changes
    const ro = new ResizeObserver(() => {
      // Trigger a sync when content size changes
      if (el.scrollLeft > 0) {
        const event = new Event('scroll')
        el.dispatchEvent(event)
      }
    })
    ro.observe(el)

    return () => {
      el.removeEventListener('scroll', onScroll)
      groupSet.delete(el)
      ro.disconnect()
    }
  }, [group])

  return (
    <div ref={ref} className={cn('overflow-x-auto overscroll-x-contain', className)} {...rest}>
      {children}
    </div>
  )
}
