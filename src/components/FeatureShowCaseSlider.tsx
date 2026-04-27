'use client'

import ScrollDownLight from '@/components/shared/ScrollDown'
import { FEATURE_SHOWCASE } from '@/constants/featureShowcase'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLenis } from 'lenis/react'
import { useCallback, useEffect, useRef, useState } from 'react'

gsap.registerPlugin(ScrollTrigger)

const SLIDE_SCRUB = 0.34
const WHEEL_DELTA_THRESHOLD = 54
const WHEEL_STEP_COOLDOWN_MS = 540
const TRANSITION_DURATION = 0.92

const FeatureShowCaseSlider = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const videoWrapperRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const mediaShellRef = useRef<HTMLDivElement>(null)

  const videoRefs = useRef<HTMLVideoElement[]>([])
  const activeIndexRef = useRef(0)
  const shownVideoIndexRef = useRef(0)
  const contentIndexRef = useRef(0)

  const wheelDeltaAccumulatorRef = useRef(0)
  const wheelLockUntilRef = useRef(0)
  const hasInitializedRef = useRef(false)
  const isSectionActiveRef = useRef(false)
  const transitionTlRef = useRef<gsap.core.Timeline | null>(null)

  const [activeIndex, setActiveIndex] = useState(0)

  const slideCount = FEATURE_SHOWCASE.length
  const lenis = useLenis()

  const configureVideo = useCallback((video: HTMLVideoElement) => {
    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.autoplay = false
    video.loop = true
    video.controls = false

    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
  }, [])

  const playVideo = useCallback(
    async (index: number, reset = false) => {
      const video = videoRefs.current[index]
      if (!video) return

      configureVideo(video)

      try {
        video.preload = 'auto'

        if (reset) {
          try {
            video.currentTime = 0
          } catch {
            // no-op
          }
        }

        await video.play()
      } catch {
        // Mobile browser can block until first gesture.
      }
    },
    [configureVideo]
  )

  const pauseVideo = useCallback((index: number) => {
    const video = videoRefs.current[index]
    if (!video) return

    video.pause()
  }, [])

  const pauseAllVideos = useCallback(() => {
    videoRefs.current.forEach((video) => {
      if (!video) return
      video.pause()
    })
  }, [])

  const prepareNearbyVideos = useCallback(
    (currentIndex: number) => {
      videoRefs.current.forEach((video, index) => {
        if (!video) return

        configureVideo(video)

        const distance = Math.abs(index - currentIndex)

        if (distance === 0) {
          video.preload = 'auto'
        } else if (distance === 1) {
          video.preload = 'metadata'
        } else {
          video.preload = 'none'
        }
      })
    },
    [configureVideo]
  )

  const pauseFarVideos = useCallback((currentIndex: number, previousIndex?: number) => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return
      if (index === currentIndex) return
      if (previousIndex !== undefined && index === previousIndex) return

      video.pause()
      video.preload = Math.abs(index - currentIndex) <= 1 ? 'metadata' : 'none'
    })
  }, [])

  useEffect(() => {
    prepareNearbyVideos(activeIndex)
  }, [activeIndex, prepareNearbyVideos])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        pauseAllVideos()
        return
      }

      if (isSectionActiveRef.current) {
        void playVideo(activeIndexRef.current, false)
      }
    }

    const onFirstGesture = () => {
      if (isSectionActiveRef.current) {
        void playVideo(activeIndexRef.current, false)
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pointerdown', onFirstGesture, { passive: true, once: true })
    window.addEventListener('touchstart', onFirstGesture, { passive: true, once: true })

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pointerdown', onFirstGesture)
      window.removeEventListener('touchstart', onFirstGesture)
    }
  }, [pauseAllVideos, playVideo])

  useEffect(() => {
    const section = sectionRef.current
    if (!section || slideCount <= 1 || !lenis) return

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY === 0) return

      const sectionTop = section.offsetTop
      const sectionEnd = sectionTop + window.innerHeight * (slideCount - 1)
      const currentScroll = lenis.scroll
      const isInsideSliderRange = currentScroll >= sectionTop && currentScroll <= sectionEnd

      if (!isInsideSliderRange) return

      const direction = event.deltaY > 0 ? 1 : -1
      const currentIndex = activeIndexRef.current
      const isFirstSlide = currentIndex === 0
      const isLastSlide = currentIndex === slideCount - 1

      /**
       * Important:
       * Do not block natural scroll when user is trying to leave section.
       * This removes dead-scroll feeling.
       */
      if (direction < 0 && isFirstSlide && currentScroll <= sectionTop + 12) return
      if (direction > 0 && isLastSlide && currentScroll >= sectionEnd - 12) return

      if (event.cancelable) {
        event.preventDefault()
      }

      const now = Date.now()
      if (now < wheelLockUntilRef.current) return

      wheelDeltaAccumulatorRef.current += event.deltaY

      if (Math.abs(wheelDeltaAccumulatorRef.current) < WHEEL_DELTA_THRESHOLD) return

      const nextIndex = gsap.utils.clamp(0, slideCount - 1, currentIndex + direction)

      wheelDeltaAccumulatorRef.current = 0

      if (nextIndex === currentIndex) return

      wheelLockUntilRef.current = now + WHEEL_STEP_COOLDOWN_MS

      lenis.scrollTo(sectionTop + nextIndex * window.innerHeight, {
        duration: 0.72,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        lock: true,
      })
    }

    window.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      window.removeEventListener('wheel', onWheel)
    }
  }, [lenis, slideCount])

  /**
   * Initial state.
   * Same design/layout, only premium-ready transform/filter states.
   */
  useGSAP(
    () => {
      const videos = videoRefs.current
      const mediaShell = mediaShellRef.current

      if (!videos.length || !mediaShell) return
      if (hasInitializedRef.current) return

      hasInitializedRef.current = true

      videos.forEach((video, index) => {
        configureVideo(video)

        gsap.set(video, {
          autoAlpha: index === 0 ? 1 : 0,
          clipPath: index === 0 ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)',
          yPercent: 0,
          scale: index === 0 ? 1 : 1.045,
          filter: index === 0 ? 'blur(0px) brightness(1)' : 'blur(14px) brightness(1.08)',
          zIndex: index === 0 ? 4 : 1,
          transformOrigin: '50% 50%',
          force3D: true,
          backfaceVisibility: 'hidden',
          willChange: 'transform,opacity,clip-path,filter',
        })
      })

      gsap.set(mediaShell, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateZ: 0.001,
        force3D: true,
        backfaceVisibility: 'hidden',
        willChange: 'transform',
      })

      gsap.set('.content-title', {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        willChange: 'transform,opacity,filter',
      })

      gsap.set('.content-desc', {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        willChange: 'transform,opacity,filter',
      })

      prepareNearbyVideos(0)
    },
    { dependencies: [configureVideo, prepareNearbyVideos] }
  )

  /**
   * ScrollTrigger decides active slide.
   */
  useGSAP(
    () => {
      const section = sectionRef.current
      if (!section) return

      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * (slideCount - 1))}`,
        scrub: SLIDE_SCRUB,
        snap:
          slideCount > 1
            ? {
                snapTo: 1 / (slideCount - 1),
                duration: { min: 0.3, max: 0.65 },
                delay: 0.015,
                ease: 'power3.out',
                inertia: false,
              }
            : undefined,
        invalidateOnRefresh: true,
        fastScrollEnd: true,

        onEnter: () => {
          isSectionActiveRef.current = true
          void playVideo(activeIndexRef.current, false)
        },

        onEnterBack: () => {
          isSectionActiveRef.current = true
          void playVideo(activeIndexRef.current, false)
        },

        onLeave: () => {
          isSectionActiveRef.current = false
          pauseAllVideos()
        },

        onLeaveBack: () => {
          isSectionActiveRef.current = false
          pauseAllVideos()
        },

        onUpdate: (self) => {
          const nextIndex = gsap.utils.clamp(0, slideCount - 1, Math.round(self.progress * (slideCount - 1)))

          if (nextIndex === activeIndexRef.current) return

          activeIndexRef.current = nextIndex
          setActiveIndex(nextIndex)
        },
      })

      return () => {
        st.kill()
      }
    },
    { scope: sectionRef, dependencies: [slideCount, playVideo, pauseAllVideos] }
  )

  /**
   * Very subtle premium floating motion.
   * Same layout, only micro movement.
   */
  useGSAP(
    () => {
      const mediaShell = mediaShellRef.current
      if (!mediaShell) return

      const tween = gsap.fromTo(
        mediaShell,
        {
          y: 18,
          scale: 0.992,
        },
        {
          y: -18,
          scale: 1.002,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.58,
          },
        }
      )

      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
      }
    },
    { scope: sectionRef }
  )

  /**
   * Content animation.
   * Same text/design, smoother bottom reveal.
   */
  useGSAP(
    () => {
      if (!hasInitializedRef.current) return
      if (activeIndex === contentIndexRef.current) return

      const direction = activeIndex > contentIndexRef.current ? 1 : -1
      contentIndexRef.current = activeIndex

      const tl = gsap.timeline({
        defaults: {
          ease: 'power3.out',
        },
      })

      tl.fromTo(
        '.content-title',
        {
          y: direction > 0 ? 34 : -24,
          opacity: 0,
          filter: 'blur(12px)',
        },
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.7,
        }
      ).fromTo(
        '.content-desc',
        {
          y: direction > 0 ? 24 : -16,
          opacity: 0,
          filter: 'blur(10px)',
        },
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.62,
        },
        '-=0.42'
      )
    },
    { dependencies: [activeIndex] }
  )

  /**
   * Premium video transition.
   * Same layout/design, improved blur + mask + depth.
   */
  useGSAP(
    () => {
      const videos = videoRefs.current

      if (!videos.length) return
      if (!hasInitializedRef.current) return

      const currentIndex = activeIndex
      const previousIndex = shownVideoIndexRef.current

      if (currentIndex === previousIndex) return

      const direction = currentIndex > previousIndex ? 1 : -1
      const currentVideo = videos[previousIndex]
      const nextVideo = videos[currentIndex]

      if (!currentVideo || !nextVideo) return

      transitionTlRef.current?.kill()

      void playVideo(previousIndex, false)
      void playVideo(currentIndex, true)

      pauseFarVideos(currentIndex, previousIndex)

      videos.forEach((video, index) => {
        gsap.set(video, {
          zIndex: index === currentIndex ? 5 : index === previousIndex ? 4 : 1,
        })
      })

      gsap.set(currentVideo, {
        autoAlpha: 1,
        clipPath: 'inset(0% 0% 0% 0%)',
        yPercent: 0,
        scale: 1,
        opacity: 1,
        filter: 'blur(0px) brightness(1) saturate(1)',
      })

      gsap.set(nextVideo, {
        autoAlpha: 1,
        clipPath: direction > 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)',
        yPercent: direction > 0 ? 8 : -8,
        scale: 1.06,
        opacity: 1,
        filter: 'blur(18px) brightness(1.1) saturate(1.06)',
      })

      const tl = gsap.timeline({
        defaults: {
          duration: TRANSITION_DURATION,
          ease: 'expo.inOut',
        },
        onComplete: () => {
          pauseVideo(previousIndex)

          gsap.set(currentVideo, {
            autoAlpha: 0,
            clipPath: direction > 0 ? 'inset(0% 0% 100% 0%)' : 'inset(100% 0% 0% 0%)',
            yPercent: 0,
            scale: 1,
            opacity: 1,
            filter: 'blur(0px) brightness(1)',
          })

          gsap.set(nextVideo, {
            autoAlpha: 1,
            clipPath: 'inset(0% 0% 0% 0%)',
            yPercent: 0,
            scale: 1,
            opacity: 1,
            filter: 'blur(0px) brightness(1) saturate(1)',
            zIndex: 5,
          })

          pauseFarVideos(currentIndex)
        },
      })

      transitionTlRef.current = tl

      tl.to(
        mediaShellRef.current,
        {
          scale: 0.986,
          duration: 0.28,
          ease: 'power2.out',
          force3D: true,
        },
        0
      )
        .to(
          mediaShellRef.current,
          {
            scale: 1,
            duration: 0.68,
            ease: 'power3.out',
            force3D: true,
          },
          0.28
        )
        .to(
          currentVideo,
          {
            clipPath: direction > 0 ? 'inset(0% 0% 100% 0%)' : 'inset(100% 0% 0% 0%)',
            yPercent: direction > 0 ? -7 : 7,
            scale: 0.968,
            opacity: 0.68,
            filter: 'blur(13px) brightness(0.92) saturate(0.94)',
            duration: TRANSITION_DURATION,
            ease: 'expo.inOut',
          },
          0
        )
        .to(
          nextVideo,
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            yPercent: 0,
            scale: 1,
            opacity: 1,
            filter: 'blur(0px) brightness(1) saturate(1)',
            duration: TRANSITION_DURATION,
            ease: 'expo.out',
          },
          0.04
        )

      shownVideoIndexRef.current = currentIndex
    },
    { dependencies: [activeIndex, pauseFarVideos, pauseVideo, playVideo] }
  )

  /**
   * Nav animation.
   */
  useGSAP(
    () => {
      const nav = navRef.current
      if (!nav) return

      const bars = Array.from(nav.children) as HTMLElement[]
      const activeBar = bars[activeIndex]

      if (!activeBar) return

      gsap.to(bars, {
        scaleX: 1,
        scaleY: 1,
        opacity: 0.55,
        duration: 0.26,
        ease: 'power2.out',
      })

      gsap.fromTo(
        activeBar,
        {
          scaleX: 1.3,
          scaleY: 0.8,
          opacity: 1,
        },
        {
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          duration: 0.52,
          ease: 'power3.out',
        }
      )
    },
    { dependencies: [activeIndex] }
  )

  useEffect(() => {
    return () => {
      transitionTlRef.current?.kill()
      pauseAllVideos()
    }
  }, [pauseAllVideos])

  const activeItem = FEATURE_SHOWCASE[activeIndex]

  return (
    <section ref={sectionRef} className="bg-bg-secondary relative" style={{ height: `${slideCount * 100}dvh` }}>
      <div className="sticky top-0 flex h-dvh items-center overflow-hidden">
        <div className="wrapper flex h-full flex-col justify-end">
          <div className="flex h-full flex-col justify-center gap-10 lg:flex-row lg:items-center">
            <div className="order-2 flex lg:order-1 lg:h-full lg:items-center">
              <div ref={navRef} className="pointer-events-none flex flex-row gap-3 lg:flex-col">
                {FEATURE_SHOWCASE.map((item, index) => (
                  <div
                    key={item.id}
                    aria-hidden
                    className={`transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] will-change-transform ${
                      activeIndex === index
                        ? 'bg-slider-active h-[3px] w-[71px] shadow-[0_0_12px_rgba(255,255,255,0.4)] lg:h-[71px] lg:w-[3px]'
                        : 'bg-slider-inactive h-[3px] w-[25px] lg:h-[25px] lg:w-[3px]'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="order-1 grid items-center gap-8 sm:gap-14 md:gap-5 lg:order-2 lg:grid-cols-2 lg:gap-20">
              <div ref={videoWrapperRef} className="relative h-full w-full">
                <div
                  ref={mediaShellRef}
                  className="relative mx-auto max-h-[420px] min-h-[394px] overflow-hidden rounded-[28px] sm:max-h-[500px] md:max-h-[450px] md:w-[500px] lg:max-h-none lg:w-[600px]"
                >
                  {FEATURE_SHOWCASE.map((item, i) => (
                    <video
                      key={item.id}
                      ref={(el) => {
                        if (el) {
                          videoRefs.current[i] = el
                          configureVideo(el)
                        }
                      }}
                      src={item.video}
                      className="absolute inset-0 h-full w-full bg-white object-cover"
                      muted
                      loop
                      playsInline
                      controls={false}
                      preload={i <= 1 ? 'metadata' : 'none'}
                      disablePictureInPicture
                      style={{ zIndex: FEATURE_SHOWCASE.length - i }}
                    />
                  ))}
                </div>
              </div>

              <div className="h-full max-w-[531px] space-y-5 sm:space-y-6 xl:space-y-8">
                <h3 className="content-title font-sf-pro text-text-primary text-[36px] leading-[128%] font-medium sm:text-[48px] xl:text-[72px]">
                  {activeItem.title}
                </h3>

                <p className="content-desc font-inter text-text-secondary text-[16px] sm:text-[18px] lg:text-[20px]">
                  {activeItem.description.replace(activeItem.highLightDescription, '')}
                  <span className="text-text-primary-muted">{activeItem.highLightDescription}</span>
                </p>
              </div>
            </div>
          </div>

          <ScrollDownLight variant="light" className="justify-end pb-[42px]" />
        </div>
      </div>
    </section>
  )
}

export default FeatureShowCaseSlider
