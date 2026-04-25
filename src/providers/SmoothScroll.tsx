'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { LenisOptions, VirtualScrollData } from 'lenis'
import 'lenis/dist/lenis.css'
import { ReactLenis, useLenis } from 'lenis/react'
import { useEffect, useMemo, useState } from 'react'

gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.config({
  ignoreMobileResize: true,
})

const easeOutExpo = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
let hasResetInitialScroll = false

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)

    update()
    media.addEventListener('change', update)

    return () => {
      media.removeEventListener('change', update)
    }
  }, [query])

  return matches
}

function shouldPreventLenis(node: HTMLElement) {
  return Boolean(
    node.closest(
      [
        '[data-lenis-prevent]',
        '[data-lenis-prevent-wheel]',
        '[data-scroll-lock]',
        '[role="dialog"]',
        'textarea',
        'select',
        'input',
      ].join(',')
    )
  )
}

function normalizeWheelScroll(data: VirtualScrollData) {
  const { event } = data

  if (!(event instanceof WheelEvent)) return true
  if (event.ctrlKey || event.metaKey) return false

  const isMostlyHorizontal = Math.abs(data.deltaX) > Math.abs(data.deltaY) * 1.35
  if (isMostlyHorizontal) return false

  data.deltaY = clamp(data.deltaY, -140, 140)
  return true
}

function useLenisOptions(): LenisOptions {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const isCoarsePointer = useMediaQuery('(pointer: coarse)')
  const isCompactViewport = useMediaQuery('(max-width: 767px)')
  const isMobileLike = isCoarsePointer || isCompactViewport

  return useMemo(
    () => ({
      autoRaf: false,
      autoResize: true,
      smoothWheel: !prefersReducedMotion,
      syncTouch: false,
      lerp: prefersReducedMotion ? 1 : isMobileLike ? 0.105 : 0.075,
      duration: prefersReducedMotion ? 0.01 : isMobileLike ? 0.78 : 1.05,
      easing: isMobileLike ? easeOutCubic : easeOutExpo,
      wheelMultiplier: isMobileLike ? 0.72 : 0.88,
      touchMultiplier: isMobileLike ? 1.08 : 1,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      overscroll: false,
      allowNestedScroll: false,
      stopInertiaOnNavigate: true,
      anchors: {
        offset: -88,
        duration: prefersReducedMotion ? 0.01 : 1,
        easing: easeOutCubic,
      },
      prevent: shouldPreventLenis,
      virtualScroll: normalizeWheelScroll,
    }),
    [isMobileLike, prefersReducedMotion]
  )
}

function GsapLenisBridge() {
  const lenis = useLenis()

  useEffect(() => {
    if (!lenis) return

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    if (!hasResetInitialScroll) {
      hasResetInitialScroll = true
      window.scrollTo(0, 0)
      lenis.scrollTo(0, { immediate: true, force: true })
      ScrollTrigger.clearScrollMemory?.()
    }

    const onLenisScroll = () => {
      ScrollTrigger.update()
    }

    lenis.on('scroll', onLenisScroll)

    const update = (time: number) => {
      if (document.hidden) return
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(update)

    let refreshRaf = 0

    const refresh = () => {
      refreshRaf = 0
      lenis.resize()
      ScrollTrigger.refresh()
    }

    const scheduleRefresh = () => {
      if (refreshRaf) return
      refreshRaf = requestAnimationFrame(refresh)
    }

    const onRefresh = () => {
      lenis.resize()
    }

    const onVisibilityChange = () => {
      if (document.hidden) return
      scheduleRefresh()
    }

    const onOrientationChange = () => {
      window.setTimeout(scheduleRefresh, 250)
    }

    ScrollTrigger.addEventListener('refresh', onRefresh)
    window.addEventListener('resize', scheduleRefresh, { passive: true })
    window.addEventListener('orientationchange', onOrientationChange, { passive: true })
    window.addEventListener('pageshow', scheduleRefresh, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)

    void document.fonts?.ready.then(scheduleRefresh)
    scheduleRefresh()

    return () => {
      if (refreshRaf) {
        cancelAnimationFrame(refreshRaf)
      }

      ScrollTrigger.removeEventListener('refresh', onRefresh)
      window.removeEventListener('resize', scheduleRefresh)
      window.removeEventListener('orientationchange', onOrientationChange)
      window.removeEventListener('pageshow', scheduleRefresh)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      lenis.off('scroll', onLenisScroll)
      gsap.ticker.remove(update)
    }
  }, [lenis])

  return null
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const options = useLenisOptions()

  return (
    <ReactLenis root options={options}>
      <GsapLenisBridge />
      {children}
    </ReactLenis>
  )
}
