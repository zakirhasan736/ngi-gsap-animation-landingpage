'use client'

import { DEVICE_STATISTICS } from '@/constants/deviceStatistics'
import { useEffect, useRef, useState } from 'react'
import BlurSlideReveal from './ui/BlurSlideReveal'

const DeviceStatistics = () => {
  const sectionRef = useRef<HTMLElement>(null)

  const cardRefs = useRef<Map<string | number, HTMLDivElement>>(new Map())
  const videoRefs = useRef<Map<string | number, HTMLVideoElement>>(new Map())

  const playedVideoIdsRef = useRef<Set<string | number>>(new Set())
  const visibleVideoIdsRef = useRef<Set<string | number>>(new Set())

  const hasUserScrolledDownRef = useRef(false)
  const lastScrollYRef = useRef(0)

  const [loadedVideoIds, setLoadedVideoIds] = useState<Set<string | number>>(() => new Set())

  const setCardRef = (id: string | number) => (el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(id, el)
    } else {
      cardRefs.current.delete(id)
    }
  }

  const setVideoRef = (id: string | number) => (el: HTMLVideoElement | null) => {
    if (el) {
      videoRefs.current.set(id, el)
    } else {
      videoRefs.current.delete(id)
    }
  }

  const markVideoLoaded = (id: string | number) => {
    setLoadedVideoIds((prev) => {
      if (prev.has(id)) return prev

      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const getItemById = (id: string | number) => {
    return DEVICE_STATISTICS.find((item) => String(item.id) === String(id))
  }

  const ensureVideoSrc = (id: string | number) => {
    const video = videoRefs.current.get(id)
    const item = getItemById(id)

    if (!video || !item) return null

    if (!video.src) {
      video.src = item.video
      video.preload = 'metadata'
      video.load()
    }

    markVideoLoaded(item.id)

    return video
  }

  const pauseVideo = (id: string | number) => {
    const video = videoRefs.current.get(id)

    if (!video) return
    if (!video.paused) video.pause()
  }

  const playVideoOnce = async (id: string | number) => {
    const item = getItemById(id)
    if (!item) return

    if (playedVideoIdsRef.current.has(item.id)) return
    if (!visibleVideoIdsRef.current.has(item.id)) return
    if (!hasUserScrolledDownRef.current) return
    if (document.hidden) return

    const video = ensureVideoSrc(item.id)
    if (!video) return

    playedVideoIdsRef.current.add(item.id)

    try {
      video.currentTime = 0
      video.muted = true
      video.playsInline = true
      await video.play()
    } catch {
      playedVideoIdsRef.current.delete(item.id)
    }
  }

  /**
   * Detect real downward scroll after page load.
   * Videos should not start just because the section is visible on initial load.
   */
  useEffect(() => {
    lastScrollYRef.current = window.scrollY

    const onScroll = () => {
      const currentY = window.scrollY

      if (currentY > lastScrollYRef.current + 4) {
        hasUserScrolledDownRef.current = true

        visibleVideoIdsRef.current.forEach((id) => {
          playVideoOnce(id)
        })
      }

      lastScrollYRef.current = currentY
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  /**
   * Lazy-load video src before the card reaches viewport.
   * This avoids loading/decoding all videos during page load.
   */
  useEffect(() => {
    const cards = Array.from(cardRefs.current.entries())

    if (!cards.length) return

    const loadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          const id = entry.target.getAttribute('data-video-id')
          if (!id) return

          const item = getItemById(id)
          if (!item) return

          ensureVideoSrc(item.id)

          loadObserver.unobserve(entry.target)
        })
      },
      {
        root: null,
        rootMargin: '900px 0px 900px 0px',
        threshold: 0.01,
      }
    )

    cards.forEach(([, card]) => {
      loadObserver.observe(card)
    })

    return () => {
      loadObserver.disconnect()
    }
  }, [])

  /**
   * Play each video only once when user scrolls down and the card becomes visible.
   * Pause if user leaves before the video finishes.
   * Do not replay after it has completed once.
   */
  useEffect(() => {
    const cards = Array.from(cardRefs.current.entries())

    if (!cards.length) return

    const playObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-video-id')
          if (!id) return

          const item = getItemById(id)
          if (!item) return

          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            visibleVideoIdsRef.current.add(item.id)
            ensureVideoSrc(item.id)
            playVideoOnce(item.id)
          } else {
            visibleVideoIdsRef.current.delete(item.id)

            const video = videoRefs.current.get(item.id)

            if (video && !video.ended && !playedVideoIdsRef.current.has(item.id)) {
              pauseVideo(item.id)
            }
          }
        })
      },
      {
        root: null,
        rootMargin: '80px 0px 80px 0px',
        threshold: [0, 0.25, 0.35, 0.6],
      }
    )

    cards.forEach(([, card]) => {
      playObserver.observe(card)
    })

    const onVisibilityChange = () => {
      if (document.hidden) {
        videoRefs.current.forEach((video) => {
          video.pause()
        })

        return
      }

      visibleVideoIdsRef.current.forEach((id) => {
        playVideoOnce(id)
      })
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      playObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)

      videoRefs.current.forEach((video) => {
        video.pause()
        video.removeAttribute('src')
        video.load()
      })
    }
  }, [])

  return (
    <section ref={sectionRef} className="wrapper min-h-svh pt-[100px]">
      <BlurSlideReveal className="mb-9" y={36} blurPx={10}>
        <h3 className="text-center text-[42px] leading-[128%] font-medium tracking-[-2%]">What is scale?</h3>
      </BlurSlideReveal>

      <div className="grid grid-cols-1 gap-x-4 gap-y-5 lg:grid-cols-2">
        {DEVICE_STATISTICS.map((item, index) => {
          const isLoaded = loadedVideoIds.has(item.id)

          return (
            <div
              key={item.id}
              ref={setCardRef(item.id)}
              data-video-id={String(item.id)}
              className="border-statistics-border group relative h-[300px] translate-y-8 animate-[deviceCardReveal_0.8s_ease_forwards] overflow-hidden rounded-[22px] border opacity-0 sm:h-[340px] lg:h-[340px]"
              style={{
                animationDelay: `${index * 90}ms`,
              }}
            >
              {item.title && (
                <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 p-5 text-center">
                  <h4 className="text-center text-[20px] leading-[128%] font-medium tracking-[-2%] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)]">
                    {item.title}
                  </h4>
                </div>
              )}

              <div className="absolute inset-0 bg-white/5" />

              <div className="h-full w-full overflow-hidden">
                <video
                  ref={setVideoRef(item.id)}
                  muted
                  playsInline
                  preload="none"
                  disablePictureInPicture
                  controls={false}
                  onEnded={(event) => {
                    const video = event.currentTarget
                    video.pause()
                  }}
                  className="h-full w-full scale-[1.01] [transform:translate3d(0,0,0)] object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.035]"
                />
              </div>

              {!isLoaded && <div className="absolute inset-0 animate-pulse bg-white/5" />}
            </div>
          )
        })}
      </div>

      <style jsx>{`
        @keyframes deviceCardReveal {
          from {
            opacity: 0;
            transform: translate3d(0, 32px, 0);
            filter: blur(10px);
          }

          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
            filter: blur(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          :global(video) {
            animation: none !important;
            transition: none !important;
          }

          div {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `}</style>
    </section>
  )
}

export default DeviceStatistics
