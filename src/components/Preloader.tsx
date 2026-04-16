'use client'

import { buildNumberedFrameUrls } from '@/lib/image-sequence'
import { usePreloaderGate } from '@/providers/PreloaderGateContext'
import { cn } from '@/utils/cn'
import { useLenis } from 'lenis/react'
import { useEffect, useState } from 'react'

declare global {
  interface Window {
    __heroPreloaderDone?: boolean
  }
}

export interface PreloaderProps {
  title?: string
  duration?: number
  onAnimationComplete?: () => void
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const EXIT_ANIMATION_MS = 1200
const HOLD_AT_FULL_MS = 320
let isInitialLoad = true
const MIN_PRELOADER_DURATION_MS = 1200

// const HERO_FRAMES = buildNumberedFrameUrls('/videos/hero-video-img', 278, {
//   prefix: 'ezgif-frame-',
//   pad: 3,
//   extension: 'webp',
// })

const SIZE_FRAMES = buildNumberedFrameUrls('/videos/size-video-img', 272, {
  prefix: 'ezgif-frame-',
  pad: 3,
  extension: 'webp',
})

const CARTRIDGE_FRAMES = buildNumberedFrameUrls('/videos/chemical-cartridge-video-img', 125, {
  prefix: 'ezgif-frame-',
  pad: 3,
  extension: 'webp',
})

const PRELOAD_ASSET_URLS = [ ...SIZE_FRAMES, ...CARTRIDGE_FRAMES]

const DEFAULT_TITLE = 'New Generation Instruments'

const titleTypographyClass =
  'font-inter-tight text-left text-[18px] leading-[128%] tracking-[-0.02em] sm:text-[24px] md:text-[32px] whitespace-nowrap'

  const preloadAssets = async (
    urls: readonly string[],
    onProgress: (loaded: number, total: number) => void,
    signal: AbortSignal,
    concurrency = 10
  ) => {
    if (!urls.length) {
      onProgress(1, 1)
      return
    }

    let loaded = 0
    let cursor = 0
    const total = urls.length

    const loadOne = (src: string) =>
      new Promise<void>((resolve) => {
        if (signal.aborted) {
          resolve()
          return
        }

        const img = new Image()
        img.decoding = 'async'

        const done = () => {
          loaded += 1
          onProgress(loaded, total)
          resolve()
        }

        img.onload = done
        img.onerror = done
        img.src = src
      })

    const worker = async () => {
      while (!signal.aborted) {
        const index = cursor
        cursor += 1
        if (index >= total) return
        await loadOne(urls[index]!)
      }
    }

    const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker())
    await Promise.all(workers)
  }

const Preloader = ({
  title = DEFAULT_TITLE,
  duration = MIN_PRELOADER_DURATION_MS,
  onAnimationComplete,
}: PreloaderProps) => {
  const lenis = useLenis()
  const { setPreloaderActive } = usePreloaderGate()
  const [isVisible, setIsVisible] = useState(isInitialLoad)
  const [isScrollLocked, setIsScrollLocked] = useState(isInitialLoad)
  const [progress, setProgress] = useState(0)
  const [hasFinishedLoading, setHasFinishedLoading] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const VIDEO_SOURCES = [
    '/videos/intro-video.webm',
    '/videos/device-pricing-circle.mp4',
  ]
  useEffect(() => {
    if (isVisible || typeof window === 'undefined') return
    window.__heroPreloaderDone = true
    window.dispatchEvent(new Event('hero-preloader-complete'))
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return
    setPreloaderActive(true)
    return () => setPreloaderActive(false)
  }, [isVisible, setPreloaderActive])

  useEffect(() => {
    if (!isScrollLocked) {
      lenis?.start()
      document.body.style.overflow = ''
      return
    }

    lenis?.stop()
    document.body.style.overflow = 'hidden'

    return () => {
      lenis?.start()
      document.body.style.overflow = ''
    }
  }, [lenis, isScrollLocked])

  useEffect(() => {
    if (!isVisible) return

    const startTime = performance.now()
    const controller = new AbortController()
    let frameId: number | null = null
    let timeRatio = 0
    let assetRatio = 0
    let minDurationDone = false
    let assetsDone = false

    const syncProgress = () => {
      const combined = Math.min(timeRatio, assetRatio)
      setProgress(Math.round(clamp(combined, 0, 1) * 100))
      if (minDurationDone && assetsDone) {
        setProgress(100)
        setHasFinishedLoading(true)
      }
    }

    const tick = (now: number) => {
      const elapsed = now - startTime
      timeRatio = clamp(elapsed / duration, 0, 1)
      if (timeRatio >= 1) minDurationDone = true
      syncProgress()

      if (!minDurationDone || !assetsDone) {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)

    void preloadAssets(
      PRELOAD_ASSET_URLS,
      (loaded, total) => {
        assetRatio = clamp(loaded / total, 0, 1)
        if (assetRatio >= 1) assetsDone = true
        syncProgress()
      },
      controller.signal
    ).catch(() => {
      assetsDone = true
      assetRatio = 1
      syncProgress()
    })

    return () => {
      controller.abort()
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [duration, isVisible])

  useEffect(() => {
    if (!hasFinishedLoading || isExiting) return

    const id = window.setTimeout(() => {
      setIsExiting(true)
      setIsScrollLocked(false)
    }, HOLD_AT_FULL_MS)

    return () => window.clearTimeout(id)
  }, [hasFinishedLoading, isExiting])

  useEffect(() => {
    if (!isExiting) return

    const id = window.setTimeout(() => {
      isInitialLoad = false
      window.__heroPreloaderDone = true
      window.dispatchEvent(new Event('hero-preloader-complete'))
      setIsVisible(false)
      onAnimationComplete?.()
    }, EXIT_ANIMATION_MS)

    return () => window.clearTimeout(id)
  }, [isExiting, onAnimationComplete])

  useEffect(() => {
    let loadedCount = 0
    const total = VIDEO_SOURCES.length

    const videos: HTMLVideoElement[] = []

    const handleLoaded = () => {
      loadedCount++

      if (loadedCount >= total) {
        setHasFinishedLoading(true)
      }
    }

    VIDEO_SOURCES.forEach((src) => {
      const video = document.createElement('video')

      video.src = src
      video.preload = 'auto'
      video.muted = true
      video.playsInline = true

      const onReady = () => {
        video.removeEventListener('canplaythrough', onReady)
        handleLoaded()
      }

      if (video.readyState >= 3) {
        handleLoaded()
      } else {
        video.addEventListener('canplaythrough', onReady)
        video.load()
      }

      videos.push(video)
    })

    return () => {
      videos.forEach((video) => {
        video.src = ''
      })
    }
  }, [])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'pointer-events-auto fixed inset-0 z-200 flex min-h-svh w-full items-center justify-center overflow-hidden',
        isExiting && 'pointer-events-none'
      )}
      aria-label="Loading"
      aria-busy={!isExiting}
    >
      <div
        className={cn(
          'absolute inset-0 flex min-h-full w-full items-center justify-center bg-black transition-transform duration-1200 ease-[cubic-bezier(0.65,0,0.35,1)] will-change-transform',
          isExiting ? '-translate-y-full' : 'translate-y-0'
        )}
      >
        <div className="wrapper flex h-svh items-center justify-center px-6">
          <div className="relative inline-block max-w-full">
            {/* Base: full line at muted color (acts as the “under” layer). */}
            <h2 className={cn(titleTypographyClass, 'relative z-0 text-white/28')} aria-hidden>
              {title}
            </h2>

            {/* Clip grows L→R; white copy is full width inside so it never wraps — only the mask width changes. */}
            <div className="absolute inset-y-0 left-0 z-10 overflow-hidden" style={{ width: `${progress}%` }}>
              <h2 className={cn(titleTypographyClass, 'text-white')} aria-live="polite">
                {title}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Preloader
