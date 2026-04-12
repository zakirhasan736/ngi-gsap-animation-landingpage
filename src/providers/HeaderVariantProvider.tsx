'use client'

import { cn } from '@/utils/cn'
import { useLenis } from 'lenis/react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/** Subpixel tolerance: treat as “touching” viewport top when zone top is at or above this Y. */
const VIEWPORT_TOP_TOUCH_PX = 1

/**
 * Registry context must stay referentially stable when `light` toggles,
 * otherwise HeaderLightZone effects re-run cleanup and disconnect all observers.
 */
type RegistryContextValue = {
  registerLightZone: (id: string, element: HTMLElement | null) => () => void
}

const HeaderLightZoneRegistryContext = createContext<RegistryContextValue | null>(null)
const HeaderVariantContext = createContext<'light' | 'dark'>('dark')

/** Light when zone top has reached the viewport top and some of the zone is still below it. */
function zoneRequestsLight(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return false

  const topReachedViewportTop = r.top <= VIEWPORT_TOP_TOUCH_PX
  const stillExtendsBelowViewportTop = r.bottom > 0

  return topReachedViewportTop && stillExtendsBelowViewportTop
}

export function HeaderVariantProvider({ children }: { children: ReactNode }) {
  const [light, setLight] = useState(false)
  const elementsRef = useRef(new Map<string, HTMLElement>())
  const rafRef = useRef(0)

  const evaluate = useCallback(() => {
    if (typeof window === 'undefined') return

    let any = false
    for (const el of elementsRef.current.values()) {
      if (zoneRequestsLight(el)) {
        any = true
        break
      }
    }
    setLight(any)
  }, [])

  const scheduleEvaluate = useCallback(() => {
    if (rafRef.current !== 0) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      evaluate()
    })
  }, [evaluate])

  useLenis(() => {
    scheduleEvaluate()
  }, [scheduleEvaluate])

  useEffect(() => {
    scheduleEvaluate()

    window.addEventListener('scroll', scheduleEvaluate, { passive: true })
    window.addEventListener('resize', evaluate)

    return () => {
      window.removeEventListener('scroll', scheduleEvaluate)
      window.removeEventListener('resize', evaluate)
      if (rafRef.current !== 0) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
    }
  }, [evaluate, scheduleEvaluate])

  const registerLightZone = useCallback(
    (id: string, element: HTMLElement | null) => {
      elementsRef.current.delete(id)
      if (element) {
        elementsRef.current.set(id, element)
      }
      evaluate()

      let resizeObserver: ResizeObserver | null = null
      if (element && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => scheduleEvaluate())
        resizeObserver.observe(element)
      }

      return () => {
        resizeObserver?.disconnect()
        elementsRef.current.delete(id)
        evaluate()
      }
    },
    [evaluate, scheduleEvaluate]
  )

  const registryValue = useMemo<RegistryContextValue>(() => ({ registerLightZone }), [registerLightZone])

  const variant: 'light' | 'dark' = light ? 'light' : 'dark'

  return (
    <HeaderLightZoneRegistryContext.Provider value={registryValue}>
      <HeaderVariantContext.Provider value={variant}>{children}</HeaderVariantContext.Provider>
    </HeaderLightZoneRegistryContext.Provider>
  )
}

export function useHeaderVariantFromScroll(): 'light' | 'dark' {
  return useContext(HeaderVariantContext)
}

export function HeaderLightZone({ children, className }: { children: ReactNode; className?: string }) {
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)
  const registry = useContext(HeaderLightZoneRegistryContext)

  useEffect(() => {
    if (!registry) return
    const el = ref.current
    if (!el) return
    return registry.registerLightZone(id, el)
  }, [registry, id])

  return (
    <div ref={ref} className={cn('w-full', className)}>
      {children}
    </div>
  )
}
