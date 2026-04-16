'use client'

import ScrollDownLight from '@/components/shared/ScrollDown'
import { FEATURE_SHOWCASE } from '@/constants/featureShowcase'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLenis } from 'lenis/react'
import { useEffect, useRef, useState } from 'react'

gsap.registerPlugin(ScrollTrigger)

const SLIDE_SCRUB = 0.6
const WHEEL_DELTA_THRESHOLD = 80
const WHEEL_STEP_COOLDOWN_MS = 900
const TRANSITION_DURATION = 1.1

const FeatureShowCaseSlider = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const videoWrapperRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const mediaShellRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<HTMLVideoElement[]>([])
  const activeIndexRef = useRef(0)
  const prevIndexRef = useRef(0)
  const wheelDeltaAccumulatorRef = useRef(0)
  const wheelLockUntilRef = useRef(0)
  const hasInitializedRef = useRef(false)

  const [activeIndex, setActiveIndex] = useState(0)
  const slideCount = FEATURE_SHOWCASE.length
  const lenis = useLenis()

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
        duration: 0.9,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        lock: true,
      })
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [lenis, slideCount])

  /**
   * Initial state: first video visible immediately.
   * No masking / no intro slide animation.
   */
  useGSAP(
    () => {
      const videos = videoRefs.current
      const mediaShell = mediaShellRef.current
      if (!videos.length || !mediaShell) return
      if (hasInitializedRef.current) return

      hasInitializedRef.current = true

      videos.forEach((video, i) => {
        gsap.set(video, {
          autoAlpha: i === 0 ? 1 : 0,
          clipPath: i === 0 ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)',
          scale: i === 0 ? 1 : 1.04,
          filter: i === 0 ? 'blur(0px)' : 'blur(12px)',
          zIndex: i === 0 ? 3 : 1,
        })
      })

      gsap.set(mediaShell, {
        opacity: 1,
        y: 0,
      })

      gsap.set('.content-title', {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
      })

      gsap.set('.content-desc', {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
      })
    },
    { dependencies: [] }
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
                duration: 0.9,
                ease: 'power2.out',
                inertia: false,
              }
            : undefined,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const nextIndex = gsap.utils.clamp(0, slideCount - 1, Math.round(self.progress * (slideCount - 1)))
          if (nextIndex === activeIndexRef.current) return
          activeIndexRef.current = nextIndex
          setActiveIndex(nextIndex)
        },
      })

      gsap.to(videoWrapperRef.current, {
        y: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })

      return () => st.kill()
    },
    { scope: sectionRef, dependencies: [slideCount] }
  )

  /**
   * Smooth floating shell follow.
   */
  useGSAP(
    () => {
      const mediaShell = mediaShellRef.current
      if (!mediaShell) return

      gsap.to(mediaShell, {
        y: 0,
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

  /**
   * Animate content only when changing slides after first render.
   */
  useGSAP(
    () => {
      if (!hasInitializedRef.current) return
      if (activeIndex === prevIndexRef.current) return

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      })

      tl.fromTo(
        '.content-title',
        {
          y: 28,
          opacity: 0,
          filter: 'blur(10px)',
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
          y: 18,
          opacity: 0,
          filter: 'blur(8px)',
        },
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.6,
        },
        '-=0.35'
      )
    },
    { dependencies: [activeIndex] }
  )

  /**
   * Video transition between slides.
   * First slide does NOT animate in automatically.
   */
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
          autoAlpha: 1,
        })
      })

      gsap.set(nextVideo, {
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
            filter: 'blur(10px)',
            scale: 0.965,
          },
          0
        ).to(
          nextVideo,
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
            scale: 0.965,
          },
          0
        ).to(
          nextVideo,
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

  /**
   * Nav animation
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
                        if (el) videoRefs.current[i] = el
                      }}
                      src={item.video}
                      className="absolute inset-0 h-full w-full bg-white object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
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
