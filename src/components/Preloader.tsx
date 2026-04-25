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

// const PRELOAD_ASSET_URLS = [...SIZE_FRAMES, ...CARTRIDGE_FRAMES]

const VIDEO_SOURCES = ['/videos/intro-video.webm']

const DEFAULT_TITLE = 'New Generation Instruments'

const titleTypographyClass =
  'font-inter-tight text-left text-[18px] leading-[128%] tracking-[-0.02em] sm:text-[24px] md:text-[32px] whitespace-nowrap'


const preloadVideos = async (sources: readonly string[], signal: AbortSignal) => {
  if (!sources.length) return

  await Promise.all(
    sources.map(
      (src) =>
        new Promise<void>((resolve) => {
          if (signal.aborted) {
            resolve()
            return
          }

          const video = document.createElement('video')
          video.preload = 'auto'
          video.muted = true
          video.playsInline = true
          video.src = src

          const done = () => {
            cleanup()
            resolve()
          }

          const cleanup = () => {
            video.removeEventListener('canplaythrough', done)
            video.removeEventListener('loadeddata', done)
            video.removeEventListener('error', done)
          }

          video.addEventListener('canplaythrough', done, { once: true })
          video.addEventListener('loadeddata', done, { once: true })
          video.addEventListener('error', done, { once: true })

          video.load()
        })
    )
  )
}

const waitForWindowLoad = () =>
  new Promise<void>((resolve) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    if (document.readyState === 'complete') {
      resolve()
      return
    }

    const onLoad = () => {
      window.removeEventListener('load', onLoad)
      resolve()
    }

    window.addEventListener('load', onLoad)
  })

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
    let minDurationDone = false
    // let imagesDone = false
    let videosDone = false
    let windowLoaded = false

    let timeRatio = 0
    // let imageRatio = 0

    const syncProgress = () => {
      /**
       * Progress bar is driven by time + image-frame preload.
       * Final completion still waits for:
       * - minimum duration
       * - all images
       * - all videos
       * - window load
       */
      const combined = Math.min(timeRatio)
      setProgress(Math.round(clamp(combined, 0, 1) * 100))

      if (minDurationDone  && videosDone && windowLoaded) {
        setProgress(100)
        setHasFinishedLoading(true)
      }
    }

    const tick = (now: number) => {
      const elapsed = now - startTime
      timeRatio = clamp(elapsed / duration, 0, 1)

      if (timeRatio >= 1) minDurationDone = true

      syncProgress()

      if (!minDurationDone  || !windowLoaded) {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)

    // void preloadImages(
    //   PRELOAD_ASSET_URLS,
    //   (loaded, total) => {
    //     imageRatio = clamp(loaded / total, 0, 1)
    //     if (imageRatio >= 1) imagesDone = true
    //     syncProgress()
    //   },
    //   controller.signal
    // ).catch(() => {
    //   imagesDone = true
    //   imageRatio = 1
    //   syncProgress()
    // })

    void preloadVideos(VIDEO_SOURCES, controller.signal)
      .then(() => {
        videosDone = true
        syncProgress()
      })
      .catch(() => {
        videosDone = true
        syncProgress()
      })

    void waitForWindowLoad().then(() => {
      windowLoaded = true
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
            <h2 className={cn(titleTypographyClass, 'relative z-0 text-white/28')} aria-hidden>
              {title}
            </h2>

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



// 'use client'

// import { buildNumberedFrameUrls } from '@/lib/image-sequence'
// import { usePreloaderGate } from '@/providers/PreloaderGateContext'
// import { cn } from '@/utils/cn'
// import { useLenis } from 'lenis/react'
// import { useEffect, useState } from 'react'

// declare global {
//   interface Window {
//     __heroPreloaderDone?: boolean
//   }
// }

// export interface PreloaderProps {
//   title?: string
//   duration?: number
//   onAnimationComplete?: () => void
// }

// const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

// const EXIT_ANIMATION_MS = 800
// const HOLD_AT_FULL_MS = 320
// let isInitialLoad = true
// const MIN_PRELOADER_DURATION_MS = 800

// const CARTRIDGE_FRAMES = buildNumberedFrameUrls('/videos/chemical-cartridge-video-img', 84, {
//   prefix: 'ezgif-frame-',
//   pad: 3,
//   extension: 'jpg',
// })

// const PRELOAD_ASSET_URLS = CARTRIDGE_FRAMES

// const VIDEO_SOURCES = ['/videos/intro-video.webm']

// const DEFAULT_TITLE = 'New Generation Instruments'

// const titleTypographyClass =
//   'font-inter-tight text-left text-[18px] leading-[128%] tracking-[-0.02em] sm:text-[24px] md:text-[32px] whitespace-nowrap'

// const preloadImages = async (
//   sources: readonly string[],
//   onProgress: (loaded: number, total: number) => void,
//   signal: AbortSignal,
//   concurrency = 6
// ) => {
//   const total = sources.length
//   if (!total) {
//     onProgress(0, 0)
//     return
//   }

//   let loaded = 0
//   let cursor = 0

//   const loadOne = (src: string) =>
//     new Promise<void>((resolve) => {
//       if (signal.aborted) {
//         resolve()
//         return
//       }

//       const img = new Image()
//       img.decoding = 'async'
//       img.loading = 'eager'

//       const done = async () => {
//         cleanup()

//         try {
//           await img.decode?.()
//         } catch {
//           // The network cache is still warm even if decode() is rejected by the browser.
//         }

//         resolve()
//       }

//       const cleanup = () => {
//         img.removeEventListener('load', done)
//         img.removeEventListener('error', done)
//         signal.removeEventListener('abort', onAbort)
//       }

//       const onAbort = () => {
//         cleanup()
//         resolve()
//       }

//       img.addEventListener('load', done, { once: true })
//       img.addEventListener('error', done, { once: true })
//       signal.addEventListener('abort', onAbort, { once: true })

//       img.src = src
//     })

//   const markLoaded = () => {
//     loaded += 1
//     onProgress(loaded, total)
//   }

//   const runWorker = async () => {
//     while (!signal.aborted) {
//       const index = cursor
//       cursor += 1

//       if (index >= total) return

//       await loadOne(sources[index]!)
//       markLoaded()
//     }
//   }

//   await Promise.all(Array.from({ length: Math.min(concurrency, total) }, runWorker))
// }

// const preloadVideos = async (sources: readonly string[], signal: AbortSignal) => {
//   if (!sources.length) return

//   await Promise.all(
//     sources.map(
//       (src) =>
//         new Promise<void>((resolve) => {
//           if (signal.aborted) {
//             resolve()
//             return
//           }

//           const video = document.createElement('video')
//           video.preload = 'auto'
//           video.muted = true
//           video.playsInline = true
//           video.src = src

//           const done = () => {
//             cleanup()
//             resolve()
//           }

//           const cleanup = () => {
//             video.removeEventListener('canplaythrough', done)
//             video.removeEventListener('loadeddata', done)
//             video.removeEventListener('error', done)
//           }

//           video.addEventListener('canplaythrough', done, { once: true })
//           video.addEventListener('loadeddata', done, { once: true })
//           video.addEventListener('error', done, { once: true })

//           video.load()
//         })
//     )
//   )
// }

// const waitForWindowLoad = () =>
//   new Promise<void>((resolve) => {
//     if (typeof window === 'undefined') {
//       resolve()
//       return
//     }

//     if (document.readyState === 'complete') {
//       resolve()
//       return
//     }

//     const onLoad = () => {
//       window.removeEventListener('load', onLoad)
//       resolve()
//     }

//     window.addEventListener('load', onLoad)
//   })

// const Preloader = ({
//   title = DEFAULT_TITLE,
//   duration = MIN_PRELOADER_DURATION_MS,
//   onAnimationComplete,
// }: PreloaderProps) => {
//   const lenis = useLenis()
//   const { setPreloaderActive } = usePreloaderGate()

//   const [isVisible, setIsVisible] = useState(isInitialLoad)
//   const [isScrollLocked, setIsScrollLocked] = useState(isInitialLoad)
//   const [progress, setProgress] = useState(0)
//   const [hasFinishedLoading, setHasFinishedLoading] = useState(false)
//   const [isExiting, setIsExiting] = useState(false)

//   useEffect(() => {
//     if (isVisible || typeof window === 'undefined') return
//     window.__heroPreloaderDone = true
//     window.dispatchEvent(new Event('hero-preloader-complete'))
//   }, [isVisible])

//   useEffect(() => {
//     if (!isVisible) return
//     setPreloaderActive(true)
//     return () => setPreloaderActive(false)
//   }, [isVisible, setPreloaderActive])

//   useEffect(() => {
//     if (!isScrollLocked) {
//       lenis?.start()
//       document.body.style.overflow = ''
//       return
//     }

//     lenis?.stop()
//     document.body.style.overflow = 'hidden'

//     return () => {
//       lenis?.start()
//       document.body.style.overflow = ''
//     }
//   }, [lenis, isScrollLocked])

//   useEffect(() => {
//     if (!isVisible) return

//     const startTime = performance.now()
//     const controller = new AbortController()

//     let frameId: number | null = null
//     let minDurationDone = false
//     let imagesDone = PRELOAD_ASSET_URLS.length === 0
//     let videosDone = false
//     let windowLoaded = false

//     let timeRatio = 0
//     let imageRatio = imagesDone ? 1 : 0

//     const syncProgress = () => {
//       const combined = timeRatio * 0.18 + imageRatio * 0.72 + (videosDone ? 0.05 : 0) + (windowLoaded ? 0.05 : 0)
//       setProgress(Math.round(clamp(combined, 0, 1) * 100))

//       if (minDurationDone && imagesDone && videosDone && windowLoaded) {
//         setProgress(100)
//         setHasFinishedLoading(true)
//       }
//     }

//     const tick = (now: number) => {
//       const elapsed = now - startTime
//       timeRatio = clamp(elapsed / duration, 0, 1)

//       if (timeRatio >= 1) minDurationDone = true

//       syncProgress()

//       if (!minDurationDone || !imagesDone || !windowLoaded) {
//         frameId = requestAnimationFrame(tick)
//       }
//     }

//     frameId = requestAnimationFrame(tick)

//     void preloadImages(
//       PRELOAD_ASSET_URLS,
//       (loaded, total) => {
//         imageRatio = total === 0 ? 1 : clamp(loaded / total, 0, 1)
//         if (imageRatio >= 1) imagesDone = true
//         syncProgress()
//       },
//       controller.signal
//     ).catch(() => {
//       imagesDone = true
//       imageRatio = 1
//       syncProgress()
//     })

//     void preloadVideos(VIDEO_SOURCES, controller.signal)
//       .then(() => {
//         videosDone = true
//         syncProgress()
//       })
//       .catch(() => {
//         videosDone = true
//         syncProgress()
//       })

//     void waitForWindowLoad().then(() => {
//       windowLoaded = true
//       syncProgress()
//     })

//     return () => {
//       controller.abort()
//       if (frameId) cancelAnimationFrame(frameId)
//     }
//   }, [duration, isVisible])

//   useEffect(() => {
//     if (!hasFinishedLoading || isExiting) return

//     const id = window.setTimeout(() => {
//       setIsExiting(true)
//       setIsScrollLocked(false)
//     }, HOLD_AT_FULL_MS)

//     return () => window.clearTimeout(id)
//   }, [hasFinishedLoading, isExiting])

//   useEffect(() => {
//     if (!isExiting) return

//     const id = window.setTimeout(() => {
//       isInitialLoad = false
//       window.__heroPreloaderDone = true
//       window.dispatchEvent(new Event('hero-preloader-complete'))
//       setIsVisible(false)
//       onAnimationComplete?.()
//     }, EXIT_ANIMATION_MS)

//     return () => window.clearTimeout(id)
//   }, [isExiting, onAnimationComplete])

//   if (!isVisible) return null

//   return (
//     <div
//       className={cn(
//         'pointer-events-auto fixed inset-0 z-200 flex min-h-svh w-full items-center justify-center overflow-hidden',
//         isExiting && 'pointer-events-none'
//       )}
//       aria-label="Loading"
//       aria-busy={!isExiting}
//     >
//       <div
//         className={cn(
//           'absolute inset-0 flex min-h-full w-full items-center justify-center bg-black transition-transform duration-1200 ease-[cubic-bezier(0.65,0,0.35,1)] will-change-transform',
//           isExiting ? '-translate-y-full' : 'translate-y-0'
//         )}
//       >
//         <div className="wrapper flex h-svh items-center justify-center px-6">
//           <div className="relative inline-block max-w-full">
//             <h2 className={cn(titleTypographyClass, 'relative z-0 text-white/28')} aria-hidden>
//               {title}
//             </h2>

//             <div className="absolute inset-y-0 left-0 z-10 overflow-hidden" style={{ width: `${progress}%` }}>
//               <h2 className={cn(titleTypographyClass, 'text-white')} aria-live="polite">
//                 {title}
//               </h2>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Preloader
