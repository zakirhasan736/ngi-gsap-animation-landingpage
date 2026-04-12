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
const WHEEL_DELTA_THRESHOLD = 45
const WHEEL_STEP_COOLDOWN_MS = 520

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
        duration: 0.55,
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
                duration: 0.6,
                ease: 'power3.out',
                inertia: true,
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
      const videoWrapper = videoWrapperRef.current
      if (!videoWrapper) return

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      })

      tl.fromTo(
        videoWrapper,
        {
          autoAlpha: 0,
          // y: 60,
          filter: 'blur(18px)',
        },
        {
          autoAlpha: 1,
          // y: 0,
          filter: 'blur(0px)',
          duration: 1.2,
        }
      )

      blurRevealRef.current?.setProgress(0)

      const progress = { value: 0 }

      tl.to(
        progress,
        {
          value: 1,
          duration: 1.1,
          ease: 'power3.out',
          onUpdate: () => {
            blurRevealRef.current?.setProgress(progress.value)
          },
        },
        '-=0.8'
      )

      gsap.to(videoWrapperRef.current, {
        y: -8,
        scale: 1.05,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
    },
    { scope: sectionRef, dependencies: [activeIndex] }
  )
  useGSAP(
    () => {
      const nav = navRef.current
      if (!nav) return

      const bars = nav.children
      const activeBar = bars[activeIndex]

      gsap.to(bars, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.35,
        ease: 'power2.out',
      })

      gsap.fromTo(
        activeBar,
        {
          scaleX: 1.7,
          scaleY: 0.6,
        },
        {
          scaleX: 1,
          scaleY: 1,
          duration: 0.9,
          ease: 'elastic.out(1,0.55)',
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
                        ? 'bg-slider-active h-[3px] w-[71px] lg:h-[71px] lg:w-[3px]'
                        : 'bg-slider-inactive h-[3px] w-[25px] lg:h-[25px] lg:w-[3px]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* slider content */}
            <div className="order-1 grid items-center gap-8 sm:gap-14 md:gap-5 lg:order-2 lg:grid-cols-2 lg:gap-20">
              {/* left video */}
              <div ref={videoWrapperRef} className="relative w-full overflow-hidden will-change-transform">
                <div className="mx-auto max-h-[420px] sm:max-h-[500px] md:max-h-[450px] md:w-[500px] lg:max-h-none lg:w-[600px]">
                  <video
                    key={activeItem.id - 1}
                    src={activeItem.video}
                    className="h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                </div>

                {/* top fade */}
                <div className="bg-slider-fade-top pointer-events-none absolute inset-x-0 top-0 h-[35%]" />

                {/* bottom fade */}
                <div className="bg-slider-fade-bottom pointer-events-none absolute inset-x-0 bottom-0 h-[35%]" />
              </div>

              {/* right content */}
              <BlurSlideReveal
                ref={blurRevealRef}
                mode="controlled"
                className="h-full max-w-[531px] space-y-5 sm:space-y-6 xl:space-y-8"
                y={40}
                blurPx={12}
                segments={[
                  { start: 0, end: 0.9, y: 42, blurPx: 14 },
                  { start: 0.1, end: 1, y: 36, blurPx: 12 },
                ]}
              >
                <h3 className="font-sf-pro text-text-primary text-[36px] leading-[128%] font-medium tracking-[-2%] will-change-[transform,opacity,filter] sm:text-[48px] xl:text-[72px]">
                  {activeItem.title}
                </h3>

                <p className="font-inter text-text-secondary text-[16px] leading-[140%] tracking-[0px] will-change-[transform,opacity,filter] sm:text-[18px] lg:text-[20px]">
                  {activeItem.description.replace(activeItem.highLightDescription, '')}
                  <span className="text-text-primary-muted">{activeItem.highLightDescription}</span>
                </p>
              </BlurSlideReveal>
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
