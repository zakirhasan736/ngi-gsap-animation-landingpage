'use client'

import ScrollDownLight from '@/components/shared/ScrollDown'
import BlurSlideReveal, { type BlurSlideRevealHandle } from '@/components/ui/BlurSlideReveal'
import { FEATURE_SHOWCASE } from '@/constants/featureShowcase'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLenis } from 'lenis/react'
import { useEffect, useRef, useState } from 'react'

gsap.registerPlugin(ScrollTrigger)

const VIDEO_FADE_UP_Y = 22
const VIDEO_FADE_DURATION = 0.68
const VIDEO_BLUR_FROM_PX = 14
const SLIDE_SCRUB = 0.6
const WHEEL_DELTA_THRESHOLD = 80
const WHEEL_STEP_COOLDOWN_MS = 900 


const INTRO_DURATION = 1.15
const TRANSITION_DURATION = 1.1

const FeatureShowCaseSlider = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const videoWrapperRef = useRef<HTMLDivElement>(null)
  const blurRevealRef = useRef<BlurSlideRevealHandle>(null)
  const activeIndexRef = useRef(0)
  const wheelDeltaAccumulatorRef = useRef(0)
  const wheelLockUntilRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const slideCount = FEATURE_SHOWCASE.length
  const lenis = useLenis()
  const navRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<HTMLVideoElement[]>([])
  const prevIndexRef = useRef(0)
  const hasPlayedIntroRef = useRef(false)
  const mediaShellRef = useRef<HTMLDivElement>(null)
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

      event.preventDefault()
      const now = Date.now()
      if (now < wheelLockUntilRef.current) return

      wheelDeltaAccumulatorRef.current += event.deltaY
      if (Math.abs(wheelDeltaAccumulatorRef.current) < WHEEL_DELTA_THRESHOLD) return

      const direction = wheelDeltaAccumulatorRef.current > 0 ? 1 : -1
      wheelDeltaAccumulatorRef.current = 0

      const nextIndex = gsap.utils.clamp(0, slideCount - 1, activeIndexRef.current + direction)
      if (nextIndex === activeIndexRef.current) return

      wheelLockUntilRef.current = now + WHEEL_STEP_COOLDOWN_MS
      lenis.scrollTo(sectionTop + nextIndex * window.innerHeight, {
        duration: 0.9, // slower
        easing: (t) => 1 - Math.pow(1 - t, 3),
        lock: true,
      })
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', onWheel)
    }
  }, [lenis, slideCount])
  useGSAP(
    () => {
      const section = sectionRef.current
      const videos = videoRefs.current
      const mediaShell = mediaShellRef.current

      if (!section || !videos.length || !mediaShell) return
      if (hasPlayedIntroRef.current) return

      const activeVideo = videos[activeIndex]
      if (!activeVideo) return

      const introTrigger = ScrollTrigger.create({
        trigger: section,
        start: 'top 72%',
        once: true,
        onEnter: () => {
          hasPlayedIntroRef.current = true

          gsap.set(activeVideo, {
            clipPath: 'inset(100% 0% 0% 0%)',
            scale: 1.08,
            filter: 'blur(18px)',
            autoAlpha: 1,
          })

          const tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
          })

          tl.fromTo(
            mediaShell,
            {
              y: 0,
              opacity: 0,
            },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
            }
          )

          tl.to(
            activeVideo,
            {
              clipPath: 'inset(0% 0% 0% 0%)',
              scale: 1,
              filter: 'blur(0px)',
              duration: INTRO_DURATION,
            },
            0
          )

          tl.fromTo(
            '.content-eyebrow, .content-title',
            {
              y: 34,
              opacity: 0,
              filter: 'blur(10px)',
            },
            {
              y: 0,
              opacity: 1,
              filter: 'blur(0px)',
              duration: 0.85,
              stagger: 0.05,
            },
            0.18
          )

          tl.fromTo(
            '.content-desc',
            {
              y: 18,
              opacity: 0,
              filter: 'blur(8px)',
            },
            {
              y: 0,
              opacity: 1,
              filter: 'blur(0px)',
              duration: 0.7,
            },
            0.28
          )
        },
      })

      return () => {
        introTrigger.kill()
      }
    },
    { dependencies: [activeIndex] }
  )
useGSAP(
  () => {
    const videos = videoRefs.current
    if (!videos.length) return

    const currentIndex = activeIndex
    const prevIndex = prevIndexRef.current

    if (currentIndex === prevIndex) return

    const direction = currentIndex > prevIndex ? 'down' : 'up'
    const currentVideo = videos[prevIndex]
    const nextVideo = videos[currentIndex]

    if (!currentVideo || !nextVideo) return

    videos.forEach((video, i) => {
      gsap.set(video, {
        zIndex: i === currentIndex ? 3 : i === prevIndex ? 2 : 1,
      })
    })

    gsap.set(nextVideo, {
      autoAlpha: 1,
      clipPath: direction === 'down' ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)',
      scale: 1.06,
      filter: 'blur(14px)',
    })

    const tl = gsap.timeline({
      defaults: { duration: TRANSITION_DURATION, ease: 'power3.inOut' },
    })

    if (direction === 'down') {
      tl.to(
        currentVideo,
        {
          clipPath: 'inset(0% 0% 100% 0%)',
          scale: 0.965,
          filter: 'blur(10px)',
        },
        0
      ).to(
        nextVideo,
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          scale: 1,
          filter: 'blur(0px)',
          ease: 'expo.out',
        },
        0
      )
    } else {
      tl.to(
        currentVideo,
        {
          clipPath: 'inset(100% 0% 0% 0%)',
          scale: 0.965,
          filter: 'blur(10px)',
        },
        0
      ).to(
        nextVideo,
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          scale: 1,
          filter: 'blur(0px)',
          ease: 'expo.out',
        },
        0
      )
    }

    prevIndexRef.current = currentIndex
  },
  { dependencies: [activeIndex] }
)
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
                duration: 0.9,
                ease: 'power2.out',
                inertia: false,
              }
            : undefined,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // Round to nearest step so each wheel intent advances slides more predictably.
          const nextIndex = gsap.utils.clamp(0, slideCount - 1, Math.round(self.progress * (slideCount - 1)))
          if (nextIndex === activeIndexRef.current) return
          activeIndexRef.current = nextIndex
          setActiveIndex(nextIndex)
        },
      })
      gsap.to(videoWrapperRef.current, {
        // y: -60,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
      return () => {
        st.kill()
      }
    },

    { scope: sectionRef, dependencies: [slideCount] }
  )
  useGSAP(
    () => {
      const mediaShell = mediaShellRef.current
      if (!mediaShell) return

      // gsap.to(mediaShell, {
      //   y: -14,
      //   duration: 3.2,
      //   ease: 'sine.inOut',
      //   repeat: -1,
      //   yoyo: true,
      // })

      gsap.to(mediaShell, {
        y: -36,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
    },
    { scope: sectionRef }
  )
useGSAP(
  () => {
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
    })

    tl.fromTo(
      '.content-eyebrow, .content-title',
      {
        y: 36,
        opacity: 0,
        filter: 'blur(10px)',
      },
      {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.9,
        stagger: 0.06,
      }
    )

    tl.fromTo(
      '.content-desc',
      {
        y: 22,
        opacity: 0,
        filter: 'blur(8px)',
      },
      {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.75,
      },
      '-=0.45'
    )
  },
  { dependencies: [activeIndex] }
)
useGSAP(
  () => {
    const videos = videoRefs.current
    if (!videos.length) return

    const currentIndex = activeIndex
    const prevIndex = prevIndexRef.current

    if (currentIndex === prevIndex) return

    const direction = currentIndex > prevIndex ? 'down' : 'up'

    const currentVideo = videos[prevIndex]
    const nextVideo = videos[currentIndex]

    if (!currentVideo || !nextVideo) return

    // RESET next video
    // reset ALL videos first
    videos.forEach((v, i) => {
      if (i !== prevIndex) {
        gsap.set(v, {
          clipPath: 'inset(100% 0% 0% 0%)',
        })
      }
    })

    // prepare next video
    gsap.set(nextVideo, {
      clipPath: direction === 'down' ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)',
    })

    const tl = gsap.timeline({
      defaults: { duration: 1.2, ease: 'power3.inOut' },
    })

    if (direction === 'down') {
      tl
        // 🎬 CURRENT VIDEO EXIT
        .to(
          currentVideo,
          {
            clipPath: 'inset(0% 0% 100% 0%)',
            filter: 'blur(10px)',
            scale: 0.96,
          },
          0
        )

        // 🎬 NEXT VIDEO ENTER
        .fromTo(
          nextVideo,
          {
            filter: 'blur(14px)',
            scale: 1.08,
          },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            filter: 'blur(0px)',
            scale: 1,
            ease: 'expo.out',
          },
          0
        )
    } else {
      tl.to(
        currentVideo,
        {
          clipPath: 'inset(100% 0% 0% 0%)',
          filter: 'blur(10px)',
          scale: 0.96,
        },
        0
      )

        .fromTo(
          nextVideo,
          {
            filter: 'blur(14px)',
            scale: 1.08,
          },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            filter: 'blur(0px)',
            scale: 1,
            ease: 'expo.out',
          },
          0
        )
    }

    prevIndexRef.current = currentIndex
  },
  { dependencies: [activeIndex] }
)
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
      duration: 0.28,
      ease: 'power2.out',
    })

    gsap.fromTo(
      activeBar,
      {
        scaleX: 1.28,
        scaleY: 0.82,
        opacity: 1,
      },
      {
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        duration: 0.55,
        ease: 'power3.out',
      }
    )
  },
  { dependencies: [activeIndex] }
)
  const activeItem = FEATURE_SHOWCASE[activeIndex]
  return (
    <section ref={sectionRef} className="bg-bg-secondary relative" style={{ height: `${slideCount * 100}dvh` }}>
      <div className="sticky top-0 flex h-dvh items-center overflow-hidden">
        <div className="wrapper flex h-full flex-col justify-end">
          <div className="flex h-full flex-col justify-center gap-10 lg:flex-row lg:items-center">
            {/* left slider nav (display only; no click interaction) */}
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

            {/* slider content */}
            <div className="order-1 grid items-center gap-8 sm:gap-14 md:gap-5 lg:order-2 lg:grid-cols-2 lg:gap-20">
              {/* left video */}
              <div ref={videoWrapperRef} className="relative h-full w-full">
                <div
                  ref={mediaShellRef}
                  className="relative mx-auto max-h-[420px] min-h-[394px] overflow-hidden rounded-[28px] sm:max-h-[500px] md:max-h-[450px] md:w-[500px] lg:max-h-none lg:w-[600px]"
                >
                  {FEATURE_SHOWCASE.map((item, i) => (
                    <video
                      key={item.id}
                      ref={(el) => {
                        if (el) videoRefs.current[i] = el
                      }}
                      src={item.video}
                      className="absolute bg-white inset-0 h-full w-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      style={{ zIndex: FEATURE_SHOWCASE.length - i }}
                    />
                  ))}

                  {/* <div className="pointer-events-none absolute inset-0 rounded-[28px] border border-white/10" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[28%] bg-gradient-to-b from-white/8 to-transparent" /> */}
                </div>
              </div>

              {/* right content */}
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

          {/* scroll down */}
          <ScrollDownLight variant="light" className="justify-end pb-[42px]" />
        </div>
      </div>
    </section>
  )
}

export default FeatureShowCaseSlider
