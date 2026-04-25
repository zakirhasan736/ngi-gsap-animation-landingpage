'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

const DevicePricing = () => {
  const disadvantages = ['Complex setup', 'Bulky machines', 'High cost']
  const benefits = ['Simple control', 'Compact hardware', 'Scalable']

  const sectionRef = useRef<HTMLElement>(null)

  const outerCircleRef = useRef<HTMLDivElement>(null)
  const otherTextRef = useRef<HTMLParagraphElement>(null)
  const ngiCircleRef = useRef<HTMLDivElement>(null)
  const ngiTextRef = useRef<HTMLSpanElement>(null)

  const otherCardRef = useRef<HTMLDivElement>(null)
  const ngiCardRef = useRef<HTMLDivElement>(null)
  const cardsStackRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const section = sectionRef.current
      const outerCircle = outerCircleRef.current
      const otherText = otherTextRef.current
      const ngiCircle = ngiCircleRef.current
      const ngiText = ngiTextRef.current
      const otherCard = otherCardRef.current
      const ngiCard = ngiCardRef.current
      const stack = cardsStackRef.current

      if (!section || !outerCircle || !otherText || !ngiCircle || !ngiText || !otherCard || !ngiCard || !stack) {
        return
      }

      const mm = gsap.matchMedia()

      const setup = (isMobile: boolean) => {
        const OUTER_FINAL = isMobile ? 280 : 576
        const OUTER_START_SCALE = isMobile ? 44 / OUTER_FINAL : 72 / OUTER_FINAL
        const OUTER_MID_SCALE = 0.74

        const INNER_FINAL = isMobile ? 42 : 72
        const INNER_START_SCALE = isMobile ? 3 / INNER_FINAL : 4 / INNER_FINAL
        const INNER_MID_SCALE = isMobile ? 18 / INNER_FINAL : 26 / INNER_FINAL

        const OTHER_FROM_Y = isMobile ? 14 : 26
        const OTHER_TO_Y = isMobile ? -86 : -210

        const syncStackHeight = () => {
          const maxCardHeight = Math.max(otherCard.offsetHeight, ngiCard.offsetHeight)
          gsap.set(stack, { height: maxCardHeight })
        }

        syncStackHeight()

        gsap.set([outerCircle, ngiCircle, otherText, ngiText, otherCard, ngiCard], {
          force3D: true,
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d',
        })

        gsap.set(outerCircle, {
          width: OUTER_FINAL,
          height: OUTER_FINAL,
          borderRadius: '50%',
          opacity: 0.35,
          scale: OUTER_START_SCALE,
          transformOrigin: '50% 50%',
          willChange: 'transform,opacity',
        })

        gsap.set(otherText, {
          opacity: 0,
          y: OTHER_FROM_Y,
          scale: 0.82,
          filter: 'blur(8px)',
          transformOrigin: '50% 50%',
          willChange: 'transform,opacity,filter',
        })

        gsap.set(ngiCircle, {
          width: INNER_FINAL,
          height: INNER_FINAL,
          borderRadius: '50%',
          opacity: 0,
          scale: INNER_START_SCALE,
          transformOrigin: '50% 50%',
          willChange: 'transform,opacity',
        })

        gsap.set(ngiText, {
          opacity: 0,
          scale: 0.72,
          filter: 'blur(8px)',
          transformOrigin: '50% 50%',
          willChange: 'transform,opacity,filter',
        })

        gsap.set(otherCard, {
          y: isMobile ? 90 : 130,
          autoAlpha: 0,
          scale: 0.985,
          zIndex: 20,
          willChange: 'transform,opacity',
        })

        gsap.set(ngiCard, {
          y: isMobile ? 100 : 150,
          autoAlpha: 0,
          scale: 0.985,
          zIndex: 30,
          willChange: 'transform,opacity',
        })

        const tl = gsap.timeline({
          defaults: {
            overwrite: 'auto',
          },
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${Math.round(window.innerHeight * (isMobile ? 2.35 : 2.75))}`,
            scrub: isMobile ? 0.28 : 0.32,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            fastScrollEnd: true,
            onRefresh: syncStackHeight,
          },
        })

        /**
         * Phase 1:
         * Other providers circle and first card appear quickly.
         */
        tl.to(
          outerCircle,
          {
            scale: OUTER_MID_SCALE,
            opacity: 1,
            duration: 0.32,
            ease: 'power3.out',
          },
          0
        )

        tl.to(
          otherText,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.28,
            ease: 'power3.out',
          },
          0.04
        )

        tl.to(
          otherCard,
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            duration: 0.3,
            ease: 'power3.out',
          },
          0.06
        )

        /**
         * Phase 2:
         * NGI starts earlier so the circle no longer feels late.
         */
        tl.to(
          outerCircle,
          {
            scale: 1,
            duration: 0.44,
            ease: 'expo.out',
          },
          0.34
        )

        tl.to(
          otherText,
          {
            y: OTHER_TO_Y,
            opacity: 1,
            scale: 0.92,
            filter: 'blur(0px)',
            duration: 0.36,
            ease: 'power3.inOut',
          },
          0.34
        )

        tl.to(
          ngiCircle,
          {
            opacity: 1,
            scale: INNER_MID_SCALE,
            duration: 0.12,
            ease: 'power3.out',
          },
          0.4
        )

        tl.to(
          ngiCircle,
          {
            scale: 1,
            duration: 0.34,
            ease: 'expo.out',
          },
          0.48
        )

        tl.to(
          ngiText,
          {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.2,
            ease: 'power3.out',
          },
          0.5
        )

        tl.to(
          otherCard,
          {
            y: () => -ngiCard.offsetHeight * 1.05,
            autoAlpha: 0,
            scale: 0.975,
            duration: 0.28,
            ease: 'power3.inOut',
          },
          0.34
        )

        tl.to(
          ngiCard,
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            duration: 0.36,
            ease: 'power3.out',
          },
          0.46
        )

        tl.to(
          [outerCircle, ngiCircle, otherText, ngiText, otherCard, ngiCard],
          {
            willChange: 'auto',
            duration: 0.01,
          },
          0.98
        )

        let resizeRaf = 0

        const handleResize = () => {
          if (resizeRaf) cancelAnimationFrame(resizeRaf)

          resizeRaf = requestAnimationFrame(() => {
            syncStackHeight()
            ScrollTrigger.refresh()
          })
        }

        window.addEventListener('resize', handleResize, { passive: true })

        return () => {
          window.removeEventListener('resize', handleResize)

          if (resizeRaf) {
            cancelAnimationFrame(resizeRaf)
          }

          tl.scrollTrigger?.kill()
          tl.kill()
        }
      }

      mm.add('(max-width: 990px)', () => setup(true))
      mm.add('(min-width: 991px)', () => setup(false))

      return () => {
        mm.revert()
      }
    },
    { scope: sectionRef }
  )

  return (
    <section
      ref={sectionRef}
      className="wrapper relative z-20 flex items-center justify-center pb-40 sm:min-h-svh sm:pb-20 lg:pb-0"
    >
      <div className="grid h-full grid-cols-1 gap-[50px] sm:pt-20 lg:grid-cols-2 xl:gap-[100px]">
        <div className="my-auto flex h-[300px] w-[300px] items-center justify-center sm:h-[400px] sm:w-[400px] xl:h-[575px] xl:w-[575px]">
          <div className="relative flex h-full w-full items-center justify-center contain-layout contain-paint">
            <div
              ref={outerCircleRef}
              className="absolute top-1/2 left-1/2 [transform:translate3d(-50%,-50%,0)] rounded-full border border-white/[0.08] bg-white/[0.09]"
            />

            <p
              ref={otherTextRef}
              className="font-inter pointer-events-none absolute top-1/2 left-1/2 z-20 [transform:translate3d(-50%,-50%,0)] text-center text-[14px] font-extralight tracking-[-0.02em] whitespace-nowrap text-white/88 opacity-95 sm:text-[18px] xl:text-[28px]"
            >
              Other providers
            </p>

            <div
              ref={ngiCircleRef}
              className="absolute top-1/2 left-1/2 z-30 flex [transform:translate3d(-50%,-50%,0)] items-center justify-center rounded-full bg-[#3E8EE8] shadow-[0_0_28px_rgba(62,142,232,0.16)]"
            >
              <span
                ref={ngiTextRef}
                className="font-sf-pro text-[12px] leading-none font-medium tracking-[-0.04em] text-white sm:text-[22px] xl:text-[35px]"
              >
                ngi
              </span>
            </div>
          </div>
        </div>

        <div
          ref={cardsStackRef}
          className="relative mx-auto my-auto w-full max-w-[535px] overflow-hidden sm:overflow-visible"
        >
          <div
            ref={otherCardRef}
            className="absolute inset-x-0 top-0 z-20 w-full overflow-hidden rounded-[20px] border border-white/15 bg-white/8 px-6 py-6 text-white sm:px-10 sm:py-8 md:px-14 md:py-10"
          >
            <div>
              <p className="mb-2 text-center text-[24px] font-normal tracking-[-0.02em] text-white/90 sm:mb-4 sm:text-[36px] md:text-[42px] xl:mb-6">
                Other providers
              </p>

              <h3 className="mb-2 text-center text-[36px] font-medium tracking-[-0.03em] sm:mb-4 sm:text-[56px] md:mb-6 md:text-[64px]">
                From $120
              </h3>

              <ul className="ml-6 flex max-w-[240px] flex-col gap-4 sm:mx-auto sm:ml-0">
                {disadvantages.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[16px] text-white sm:text-[20px]">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/45" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            ref={ngiCardRef}
            className="absolute inset-x-0 top-0 z-10 w-full overflow-hidden rounded-[20px] bg-[linear-gradient(114deg,#1F5A93_0%,#5AA9FF_100%)] px-6 py-8 text-white sm:px-10 sm:py-10 md:px-14 md:py-12"
          >
            <div className="relative z-10">
              <div className="flex justify-center">
                <h2 className="font-sf-pro text-[28px] leading-[128%] font-medium tracking-[-2%] sm:text-[48px] xl:text-[72px]">
                  ngi
                </h2>
              </div>

              <h3 className="mt-4 text-center text-[36px] leading-[1.1] font-normal tracking-[-0.03em] sm:text-[56px]">
                From $25
              </h3>

              <ul className="ngi-benefits-pulse-list mx-auto mt-8 ml-6 flex max-w-[260px] flex-col gap-4 sm:mt-10 sm:ml-0">
                {benefits.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[18px] font-normal text-white sm:text-[22px]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/70">
                      <span className="h-2.5 w-2.5 rounded-full bg-white" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DevicePricing
