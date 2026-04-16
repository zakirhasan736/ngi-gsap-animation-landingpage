'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import 'lenis/dist/lenis.css'
import { ReactLenis, useLenis } from 'lenis/react'
import { useEffect } from 'react'

gsap.registerPlugin(ScrollTrigger)

function GsapLenisBridge() {
  const lenis = useLenis()

  useEffect(() => {
    if (!lenis) return

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    window.scrollTo(0, 0)
    lenis.scrollTo(0, { immediate: true })
    ScrollTrigger.clearScrollMemory?.()

    const onLenisScroll = () => {
      ScrollTrigger.update()
    }

    lenis.on('scroll', onLenisScroll)

    const update = (time: number) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)

    const onRefresh = () => {
      lenis.resize()
    }

    ScrollTrigger.addEventListener('refresh', onRefresh)
    ScrollTrigger.refresh()

    return () => {
      ScrollTrigger.removeEventListener('refresh', onRefresh)
      lenis.off('scroll', onLenisScroll)
      gsap.ticker.remove(update)
    }
  }, [lenis])

  return null
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        /**
         * Slightly smoother + more premium than your current setup
         * without becoming too floaty.
         */
        lerp: 0.065,
        duration: 1.15,
        smoothWheel: true,
        syncTouch: false,
        autoRaf: false,
        wheelMultiplier: 0.95,
        touchMultiplier: 1,
      }}
    >
      <GsapLenisBridge />
      {children}
    </ReactLenis>
  )
}
