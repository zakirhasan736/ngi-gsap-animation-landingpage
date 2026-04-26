'use client'

import { DEVICE_STATISTICS } from '@/constants/deviceStatistics'
import { useCallback, useEffect, useRef, useState } from 'react'
import BlurSlideReveal from './ui/BlurSlideReveal'

type VideoId = string | number

const isBrowser = typeof window !== 'undefined'

const VIDEO_SPEED_DESKTOP = 2.15
const VIDEO_SPEED_MOBILE = 1.65

const NEXT_VIDEO_GAP_DESKTOP = 15
const NEXT_VIDEO_GAP_MOBILE = 25

const DeviceStatistics = () => {
  const sectionRef = useRef<HTMLElement>(null)

  const cardRefs = useRef<Map<VideoId, HTMLDivElement>>(new Map())
  const videoRefs = useRef<Map<VideoId, HTMLVideoElement>>(new Map())

  const srcAttachedVideoIdsRef = useRef<Set<VideoId>>(new Set())
  const eligibleVideoIdsRef = useRef<Set<VideoId>>(new Set())
  const startedVideoIdsRef = useRef<Set<VideoId>>(new Set())
  const completedVideoIdsRef = useRef<Set<VideoId>>(new Set())

  const activeVideoIdRef = useRef<VideoId | null>(null)
  const playingAttemptIdRef = useRef<VideoId | null>(null)

  const loadQueueRef = useRef<VideoId[]>([])
  const loadingVideoIdsRef = useRef<Set<VideoId>>(new Set())
  const activeLoadsRef = useRef(0)

  const loadTimerRef = useRef<number | null>(null)
  const playbackRafRef = useRef<number | null>(null)

  const [loadedVideoIds, setLoadedVideoIds] = useState<Set<VideoId>>(() => new Set())
  const [completedVideoIdSet, setCompletedVideoIdSet] = useState<Set<VideoId>>(() => new Set())
  const [activeVideoId, setActiveVideoId] = useState<VideoId | null>(null)

  const isMobileViewport = useCallback(() => {
    if (!isBrowser) return false
    return window.matchMedia('(max-width: 767px)').matches
  }, [])

  const getPlaybackRate = useCallback(() => {
    return isMobileViewport() ? VIDEO_SPEED_MOBILE : VIDEO_SPEED_DESKTOP
  }, [isMobileViewport])

  const getNextVideoGap = useCallback(() => {
    return isMobileViewport() ? NEXT_VIDEO_GAP_MOBILE : NEXT_VIDEO_GAP_DESKTOP
  }, [isMobileViewport])

  const getItemById = useCallback((id: VideoId) => {
    return DEVICE_STATISTICS.find((item) => String(item.id) === String(id))
  }, [])

  const markVideoLoaded = useCallback((id: VideoId) => {
    setLoadedVideoIds((prev) => {
      if (prev.has(id)) return prev

      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const markVideoCompleted = useCallback((id: VideoId) => {
    completedVideoIdsRef.current.add(id)

    setCompletedVideoIdSet((prev) => {
      if (prev.has(id)) return prev

      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const configureVideo = useCallback(
    (video: HTMLVideoElement) => {
      const playbackRate = getPlaybackRate()

      video.muted = true
      video.defaultMuted = true
      video.playsInline = true
      video.autoplay = false
      video.loop = false
      video.controls = false
      video.preload = 'metadata'
      video.defaultPlaybackRate = playbackRate
      video.playbackRate = playbackRate

      video.setAttribute('muted', '')
      video.setAttribute('playsinline', '')
      video.setAttribute('webkit-playsinline', '')
    },
    [getPlaybackRate]
  )

  const freezeVideoOnLastFrame = useCallback((video: HTMLVideoElement) => {
    video.pause()

    const duration = video.duration

    if (Number.isFinite(duration) && duration > 0.12) {
      try {
        video.currentTime = Math.max(duration - 0.06, 0)
      } catch {
        // Mobile Safari can block seeking after ended.
        // Native ended frame will still remain visible.
      }
    }
  }, [])

  const unlockActiveVideo = useCallback((id?: VideoId) => {
    if (id === undefined || String(activeVideoIdRef.current) === String(id)) {
      activeVideoIdRef.current = null
      setActiveVideoId(null)
    }

    if (id === undefined || String(playingAttemptIdRef.current) === String(id)) {
      playingAttemptIdRef.current = null
    }
  }, [])

  const setCardRef = useCallback(
    (id: VideoId) => (el: HTMLDivElement | null) => {
      if (el) {
        cardRefs.current.set(id, el)
      } else {
        cardRefs.current.delete(id)
      }
    },
    []
  )

  const setVideoRef = useCallback(
    (id: VideoId) => (el: HTMLVideoElement | null) => {
      if (el) {
        configureVideo(el)
        videoRefs.current.set(id, el)
      } else {
        videoRefs.current.delete(id)
      }
    },
    [configureVideo]
  )

  const attachVideoSrc = useCallback(
    (id: VideoId, preload: 'metadata' | 'auto' = 'metadata') => {
      const item = getItemById(id)
      if (!item) return null

      const video = videoRefs.current.get(item.id)
      if (!video) return null

      configureVideo(video)
      video.preload = preload

      if (!srcAttachedVideoIdsRef.current.has(item.id)) {
        video.src = item.video
        srcAttachedVideoIdsRef.current.add(item.id)

        try {
          video.load()
        } catch {
          // no-op
        }
      }

      return video
    },
    [configureVideo, getItemById]
  )

  const pumpLoadQueue = useCallback(() => {
    if (!isBrowser) return
    if (loadTimerRef.current) return

    loadTimerRef.current = window.setTimeout(
      () => {
        loadTimerRef.current = null

        if (activeLoadsRef.current >= 1) {
          if (loadQueueRef.current.length > 0) {
            pumpLoadQueue()
          }

          return
        }

        const nextId = loadQueueRef.current.shift()

        if (nextId === undefined || nextId === null) return

        const item = getItemById(nextId)

        if (!item) {
          pumpLoadQueue()
          return
        }

        if (completedVideoIdsRef.current.has(item.id)) {
          pumpLoadQueue()
          return
        }

        if (loadingVideoIdsRef.current.has(item.id)) {
          pumpLoadQueue()
          return
        }

        const video = attachVideoSrc(item.id, 'metadata')

        if (!video) {
          pumpLoadQueue()
          return
        }

        loadingVideoIdsRef.current.add(item.id)
        activeLoadsRef.current += 1

        let finished = false

        const finish = () => {
          if (finished) return

          finished = true

          video.removeEventListener('loadedmetadata', onMetadata)
          video.removeEventListener('loadeddata', onReady)
          video.removeEventListener('canplay', onReady)
          video.removeEventListener('error', finish)

          loadingVideoIdsRef.current.delete(item.id)
          activeLoadsRef.current = Math.max(0, activeLoadsRef.current - 1)

          if (loadQueueRef.current.length > 0) {
            pumpLoadQueue()
          }
        }

        const onMetadata = () => {
          finish()
        }

        const onReady = () => {
          markVideoLoaded(item.id)
          finish()
        }

        video.addEventListener('loadedmetadata', onMetadata, { once: true })
        video.addEventListener('loadeddata', onReady, { once: true })
        video.addEventListener('canplay', onReady, { once: true })
        video.addEventListener('error', finish, { once: true })

        window.setTimeout(finish, isMobileViewport() ? 1300 : 1000)
      },
      isMobileViewport() ? 100 : 45
    )
  }, [attachVideoSrc, getItemById, isMobileViewport, markVideoLoaded])

  const queueVideoLoad = useCallback(
    (id: VideoId) => {
      const item = getItemById(id)
      if (!item) return

      if (srcAttachedVideoIdsRef.current.has(item.id)) return
      if (loadingVideoIdsRef.current.has(item.id)) return
      if (loadQueueRef.current.some((queueId) => String(queueId) === String(item.id))) return

      loadQueueRef.current.push(item.id)
      pumpLoadQueue()
    },
    [getItemById, pumpLoadQueue]
  )

  const pauseVideo = useCallback(
    (id: VideoId) => {
      const item = getItemById(id)
      if (!item) return

      const video = videoRefs.current.get(item.id)
      if (!video) return

      if (!video.paused) {
        video.pause()
      }

      unlockActiveVideo(item.id)
    },
    [getItemById, unlockActiveVideo]
  )

  const pauseEveryUnfinishedVideoExcept = useCallback((id: VideoId) => {
    videoRefs.current.forEach((video, videoId) => {
      if (String(videoId) === String(id)) return
      if (completedVideoIdsRef.current.has(videoId)) return

      if (!video.paused) {
        video.pause()
      }
    })
  }, [])

  const getNextEligibleVideoId = useCallback(() => {
    return DEVICE_STATISTICS.find((item) => {
      if (completedVideoIdsRef.current.has(item.id)) return false
      if (!eligibleVideoIdsRef.current.has(item.id)) return false
      return true
    })?.id
  }, [])

  const playVideoOnce = useCallback(
    async (id: VideoId) => {
      const item = getItemById(id)
      if (!item) return

      if (document.hidden) return
      if (completedVideoIdsRef.current.has(item.id)) return
      if (!eligibleVideoIdsRef.current.has(item.id)) return

      if (activeVideoIdRef.current && String(activeVideoIdRef.current) !== String(item.id)) return
      if (playingAttemptIdRef.current && String(playingAttemptIdRef.current) !== String(item.id)) return

      const video = attachVideoSrc(item.id, 'auto')
      if (!video) return

      configureVideo(video)

      activeVideoIdRef.current = item.id
      playingAttemptIdRef.current = item.id
      setActiveVideoId(item.id)

      pauseEveryUnfinishedVideoExcept(item.id)

      try {
        if (video.ended) {
          markVideoCompleted(item.id)
          freezeVideoOnLastFrame(video)
          unlockActiveVideo(item.id)
          return
        }

        if (video.readyState < 2) {
          await new Promise<void>((resolve) => {
            let done = false

            const finish = () => {
              if (done) return

              done = true

              video.removeEventListener('loadeddata', finish)
              video.removeEventListener('canplay', finish)
              video.removeEventListener('error', finish)

              resolve()
            }

            video.addEventListener('loadeddata', finish, { once: true })
            video.addEventListener('canplay', finish, { once: true })
            video.addEventListener('error', finish, { once: true })

            window.setTimeout(finish, isMobileViewport() ? 750 : 520)
          })
        }

        if (document.hidden) {
          unlockActiveVideo(item.id)
          return
        }

        if (completedVideoIdsRef.current.has(item.id)) {
          unlockActiveVideo(item.id)
          return
        }

        if (!eligibleVideoIdsRef.current.has(item.id)) {
          pauseVideo(item.id)
          return
        }

        if (!startedVideoIdsRef.current.has(item.id)) {
          try {
            video.currentTime = 0
          } catch {
            // no-op
          }

          startedVideoIdsRef.current.add(item.id)
        }

        const playbackRate = getPlaybackRate()

        video.defaultPlaybackRate = playbackRate
        video.playbackRate = playbackRate

        await video.play()

        if (video.readyState >= 2) {
          markVideoLoaded(item.id)
        }
      } catch {
        pauseVideo(item.id)
      } finally {
        playingAttemptIdRef.current = null
      }
    },
    [
      attachVideoSrc,
      configureVideo,
      freezeVideoOnLastFrame,
      getItemById,
      getPlaybackRate,
      isMobileViewport,
      markVideoCompleted,
      markVideoLoaded,
      pauseEveryUnfinishedVideoExcept,
      pauseVideo,
      unlockActiveVideo,
    ]
  )

  const scheduleSequentialPlayback = useCallback(() => {
    if (!isBrowser) return
    if (playbackRafRef.current) return

    playbackRafRef.current = window.requestAnimationFrame(() => {
      playbackRafRef.current = null

      if (document.hidden) {
        videoRefs.current.forEach((video) => video.pause())
        unlockActiveVideo()
        return
      }

      if (activeVideoIdRef.current || playingAttemptIdRef.current) return

      const nextId = getNextEligibleVideoId()

      if (nextId === undefined || nextId === null) return

      queueVideoLoad(nextId)
      playVideoOnce(nextId)
    })
  }, [getNextEligibleVideoId, playVideoOnce, queueVideoLoad, unlockActiveVideo])

  const handleVideoEnded = useCallback(
    (id: VideoId, video: HTMLVideoElement) => {
      const item = getItemById(id)
      if (!item) return

      markVideoCompleted(item.id)
      markVideoLoaded(item.id)
      freezeVideoOnLastFrame(video)
      unlockActiveVideo(item.id)

      window.setTimeout(() => {
        scheduleSequentialPlayback()
      }, getNextVideoGap())
    },
    [
      freezeVideoOnLastFrame,
      getItemById,
      getNextVideoGap,
      markVideoCompleted,
      markVideoLoaded,
      scheduleSequentialPlayback,
      unlockActiveVideo,
    ]
  )

  useEffect(() => {
    const cards = Array.from(cardRefs.current.values())
    if (!cards.length) return

    const isMobile = isMobileViewport()

    const loadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          const rawId = entry.target.getAttribute('data-video-id')
          if (rawId === null) return

          const item = getItemById(rawId)
          if (!item) return

          queueVideoLoad(item.id)
          loadObserver.unobserve(entry.target)
        })
      },
      {
        root: null,
        rootMargin: isMobile ? '280px 0px 280px 0px' : '560px 0px 560px 0px',
        threshold: 0.01,
      }
    )

    cards.forEach((card) => loadObserver.observe(card))

    return () => {
      loadObserver.disconnect()
    }
  }, [getItemById, isMobileViewport, queueVideoLoad])

  useEffect(() => {
    const cards = Array.from(cardRefs.current.values())
    if (!cards.length) return

    const isMobile = isMobileViewport()

    const playObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const rawId = entry.target.getAttribute('data-video-id')
          if (rawId === null) return

          const item = getItemById(rawId)
          if (!item) return

          const shouldBeEligible = entry.isIntersecting && entry.intersectionRatio >= (isMobile ? 0.16 : 0.22)

          if (shouldBeEligible) {
            eligibleVideoIdsRef.current.add(item.id)
            queueVideoLoad(item.id)
          } else {
            eligibleVideoIdsRef.current.delete(item.id)

            if (String(activeVideoIdRef.current) === String(item.id) && !completedVideoIdsRef.current.has(item.id)) {
              pauseVideo(item.id)
            }
          }
        })

        scheduleSequentialPlayback()
      },
      {
        root: null,
        rootMargin: isMobile ? '0px 0px -4% 0px' : '50px 0px 50px 0px',
        threshold: isMobile ? [0, 0.1, 0.16, 0.32] : [0, 0.14, 0.22, 0.42],
      }
    )

    cards.forEach((card) => playObserver.observe(card))

    const onVisibilityChange = () => {
      if (document.hidden) {
        videoRefs.current.forEach((video) => video.pause())
        unlockActiveVideo()
        return
      }

      scheduleSequentialPlayback()
    }

    const onFirstGesture = () => {
      scheduleSequentialPlayback()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('touchstart', onFirstGesture, { passive: true, once: true })
    window.addEventListener('pointerdown', onFirstGesture, { passive: true, once: true })

    return () => {
      playObserver.disconnect()

      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('touchstart', onFirstGesture)
      window.removeEventListener('pointerdown', onFirstGesture)

      if (loadTimerRef.current) {
        window.clearTimeout(loadTimerRef.current)
        loadTimerRef.current = null
      }

      if (playbackRafRef.current) {
        window.cancelAnimationFrame(playbackRafRef.current)
        playbackRafRef.current = null
      }

      videoRefs.current.forEach((video) => {
        video.pause()
        video.removeAttribute('src')

        try {
          video.load()
        } catch {
          // no-op
        }
      })

      loadQueueRef.current = []
      loadingVideoIdsRef.current.clear()
      srcAttachedVideoIdsRef.current.clear()
      eligibleVideoIdsRef.current.clear()
      startedVideoIdsRef.current.clear()
      completedVideoIdsRef.current.clear()

      activeVideoIdRef.current = null
      playingAttemptIdRef.current = null
      activeLoadsRef.current = 0
    }
  }, [getItemById, isMobileViewport, pauseVideo, queueVideoLoad, scheduleSequentialPlayback, unlockActiveVideo])

  return (
    <section ref={sectionRef} className="wrapper min-h-svh pt-[72px] sm:pt-[100px]">
      <BlurSlideReveal className="mb-7 sm:mb-9" y={30} blurPx={8}>
        <h3 className="text-center text-[32px] leading-[128%] font-medium tracking-[-2%] sm:text-[42px]">
          What is scale?
        </h3>
      </BlurSlideReveal>

      <div className="grid grid-cols-1 gap-x-4 gap-y-5 lg:grid-cols-2">
        {DEVICE_STATISTICS.map((item, index) => {
          const isLoaded = loadedVideoIds.has(item.id)
          const isActive = String(activeVideoId) === String(item.id)
          const isCompleted = completedVideoIdSet.has(item.id)

          return (
            <div
              key={item.id}
              ref={setCardRef(item.id)}
              data-video-id={String(item.id)}
              className={[
                'device-stat-card border-statistics-border group relative h-[280px] overflow-hidden rounded-[18px] border opacity-0 [contain:layout_paint] sm:h-[340px] sm:rounded-[22px] lg:h-[340px]',
                isActive ? 'is-playing' : '',
                isCompleted ? 'is-completed' : '',
              ].join(' ')}
              style={{
                animationDelay: `${index * 55}ms`,
              }}
            >
              {item.title && (
                <div className="pointer-events-none absolute top-0 right-0 left-0 z-30 p-4 text-center sm:p-5">
                  <h4 className="text-center text-[17px] leading-[128%] font-medium tracking-[-2%] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)] sm:text-[20px]">
                    {item.title}
                  </h4>
                </div>
              )}

              <div className="absolute inset-0 z-0 bg-white/5" />

              <div className="relative z-10 h-full w-full overflow-hidden">
                <video
                  ref={setVideoRef(item.id)}
                  muted
                  playsInline
                  preload="metadata"
                  disablePictureInPicture
                  controls={false}
                  loop={false}
                  onLoadedData={() => markVideoLoaded(item.id)}
                  onCanPlay={() => markVideoLoaded(item.id)}
                  onEnded={(event) => {
                    handleVideoEnded(item.id, event.currentTarget)
                  }}
                  className={[
                    'h-full w-full scale-[1.01] transform-gpu object-cover transition-transform duration-500 ease-out',
                    isActive ? 'scale-[1.03]' : 'md:group-hover:scale-[1.015]',
                    isCompleted ? 'scale-[1.012]' : '',
                  ].join(' ')}
                />
              </div>

              <div className="device-stat-glow pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-400" />

              {isActive && (
                <div className="device-stat-badge hidden pointer-events-none absolute right-4 bottom-4 z-40  items-center gap-2 rounded-full border border-white/12 bg-black/25 px-3 py-1.5 text-[11px] font-medium tracking-[-0.2px] text-white/80 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_14px_rgba(255,255,255,0.75)]" />
                  Playing
                </div>
              )}

              {isCompleted && (
                <div className="device-stat-badge hidden pointer-events-none absolute right-4 bottom-4 z-40 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] font-medium tracking-[-0.2px] text-white/65 backdrop-blur-md">
                  Complete
                </div>
              )}

              {!isLoaded && <div className="device-stat-loader pointer-events-none absolute inset-0 z-40 bg-white/5" />}
            </div>
          )
        })}
      </div>

      <style jsx>{`
        .device-stat-card {
          transform: translate3d(0, 24px, 0);
          animation: deviceCardReveal 0.58s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transition:
            transform 380ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 380ms ease,
            box-shadow 380ms ease;
          will-change: transform;
        }

        .device-stat-card.is-playing {
          transform: translate3d(0, -2px, 0) scale(1.01);
          border-color: rgba(255, 255, 255, 0.18);
          box-shadow:
            0 22px 58px rgba(0, 0, 0, 0.26),
            0 0 0 1px rgba(255, 255, 255, 0.04) inset;
        }

        .device-stat-card.is-completed {
          border-color: rgba(255, 255, 255, 0.1);
        }

        .device-stat-card.is-playing .device-stat-glow {
          opacity: 1;
          background:
            radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.14), transparent 42%),
            linear-gradient(120deg, transparent 20%, rgba(255, 255, 255, 0.08), transparent 72%);
          animation: deviceLightSweep 1.35s ease-in-out infinite;
        }

        .device-stat-loader {
          animation: deviceLoaderBreath 1s ease-in-out infinite;
        }

        .device-stat-badge {
          animation: deviceBadgeIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes deviceCardReveal {
          from {
            opacity: 0;
            transform: translate3d(0, 24px, 0) scale(0.988);
          }

          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes deviceLightSweep {
          0% {
            opacity: 0.45;
            transform: translate3d(-7%, 0, 0);
          }

          50% {
            opacity: 1;
          }

          100% {
            opacity: 0.45;
            transform: translate3d(7%, 0, 0);
          }
        }

        @keyframes deviceLoaderBreath {
          0%,
          100% {
            opacity: 0.22;
          }

          50% {
            opacity: 0.48;
          }
        }

        @keyframes deviceBadgeIn {
          from {
            opacity: 0;
            transform: translate3d(0, 8px, 0) scale(0.96);
          }

          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @media (max-width: 767px) {
          .device-stat-card {
            animation-duration: 0.48s;
            transition:
              transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
              border-color 320ms ease,
              box-shadow 320ms ease;
          }

          .device-stat-card.is-playing {
            transform: translate3d(0, -1px, 0) scale(1.005);
            box-shadow:
              0 14px 36px rgba(0, 0, 0, 0.2),
              0 0 0 1px rgba(255, 255, 255, 0.035) inset;
          }

          .device-stat-card.is-playing .device-stat-glow {
            animation-duration: 1.8s;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .device-stat-card,
          .device-stat-card.is-playing,
          .device-stat-loader,
          .device-stat-glow,
          .device-stat-badge,
          :global(video) {
            animation: none !important;
            transition: none !important;
          }

          .device-stat-card {
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  )
}

export default DeviceStatistics
