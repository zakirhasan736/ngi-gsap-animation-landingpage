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

  // left circle animation
  const outerCircleRef = useRef<HTMLDivElement>(null)
  const otherTextRef = useRef<HTMLParagraphElement>(null)
  const ngiCircleRef = useRef<HTMLDivElement>(null)
  const ngiTextRef = useRef<HTMLSpanElement>(null)

  // right cards
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
        const OUTER_FINAL = isMobile ? 320 : 576
        const OUTER_START = isMobile ? 44 : 72
        const OUTER_MID = OUTER_FINAL * 0.74

        const INNER_START = isMobile ? 3 : 4
        const INNER_MID = isMobile ? 18 : 26
        const INNER_FINAL = isMobile ? 72 : 72

        const OTHER_FROM_Y = isMobile ? 16 : 22
        const OTHER_TO_Y = isMobile ? -150 : -215

        const syncStackHeight = () => {
          const maxCardHeight = Math.max(otherCard.offsetHeight, ngiCard.offsetHeight)
          gsap.set(stack, { height: maxCardHeight })
        }

        syncStackHeight()

        // LEFT initial
        gsap.set(outerCircle, {
          width: OUTER_START,
          height: OUTER_START,
          borderRadius: '50%',
          opacity: 0,
        })

        gsap.set(otherText, {
          opacity: 0,
          y: OTHER_FROM_Y,
          scale: 0.3,
          filter: 'blur(10px)',
        })

        gsap.set(ngiCircle, {
          width: INNER_START,
          height: INNER_START,
          borderRadius: '50%',
          opacity: 0,
        })

        gsap.set(ngiText, {
          opacity: 0,
          scale: 0.3,
          filter: 'blur(10px)',
        })

        // RIGHT initial
        gsap.set(otherCard, {
          y: 180,
          autoAlpha: 0,
          scale: 1.02,
          zIndex: 20,
        })

        gsap.set(ngiCard, {
          y: 180,
          autoAlpha: 0,
          scale: 1.02,
          zIndex: 30,
        })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${Math.round(window.innerHeight * (isMobile ? 3 : 3.3))}`,
            scrub: isMobile ? 1 : 0.9,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })

        /**
         * 0% -> 50%
         * Left:
         * - big dark circle grows
         * - Other providers becomes centered and visible
         *
         * Right:
         * - first card comes in
         */
        tl.to(
          outerCircle,
          {
            width: OUTER_MID,
            height: OUTER_MID,
            duration: 0.5,
            opacity: 1,
            ease: 'power2.out',
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
            duration: 0.34,
            ease: 'power2.out',
          },
          0.14
        )

        tl.to(
          otherCard,
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            duration: 0.32,
            ease: 'power2.out',
          },
          0.14
        )

        /**
         * 50% -> 100%
         * Left:
         * - Other providers goes up but stays visible
         * - NGI appears in middle
         * - outer circle reaches full size
         *
         * Right:
         * - first card leaves upward
         * - second card comes from below
         */
        tl.to(
          outerCircle,
          {
            width: OUTER_FINAL,
            height: OUTER_FINAL,
            duration: 0.45,
            ease: 'expo.out',
          },
          0.56
        )

        tl.to(
          otherText,
          {
            y: OTHER_TO_Y,
            opacity: 1,
            scale: 0.92,
            filter: 'blur(0px)',
            duration: 0.45,
            ease: 'power2.inOut',
          },
          0.5
        )

        tl.to(
          ngiCircle,
          {
            opacity: 1,
            width: INNER_MID,
            height: INNER_MID,
            duration: 0.14,
            ease: 'power2.out',
          },
          0.58
        )

        tl.to(
          ngiCircle,
          {
            width: INNER_FINAL,
            height: INNER_FINAL,
            duration: 0.32,
            ease: 'expo.out',
          },
          0.68
        )

        tl.to(
          ngiText,
          {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.22,
            ease: 'power2.out',
          },
          0.66
        )

        tl.to(
          otherCard,
          {
            y: -ngiCard.offsetHeight * 1.2,
            autoAlpha: 0,
            scale: 0.98,
            duration: 0.28,
            ease: 'power2.inOut',
          },
          0.52
        )

        tl.to(
          ngiCard,
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            duration: 0.34,
            ease: 'power2.out',
          },
          0.62
        )

        const handleResize = () => {
          syncStackHeight()
          ScrollTrigger.refresh()
        }

        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
          tl.scrollTrigger?.kill()
          tl.kill()
        }
      }

      mm.add('(max-width: 990px)', () => setup(true))
      mm.add('(min-width: 991px)', () => setup(false))

      return () => mm.revert()
    },
    { scope: sectionRef }
  )

  return (
    <section
      ref={sectionRef}
      className="wrapper relative z-20 flex items-center justify-center pb-40 sm:min-h-svh sm:pb-20 lg:pb-0"
    >
      <div className="grid h-full grid-cols-1 gap-[50px] sm:pt-20 lg:grid-cols-2 xl:gap-[100px]">
        {/* left circle animation */}
        <div className="flex my-auto h-[300px] w-[300px] items-center justify-center sm:h-[400px] sm:w-[400px] xl:h-[575px] xl:w-[575px]">
          <div className="relative flex h-full w-full items-center justify-center">
            <div
              ref={outerCircleRef}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08] bg-white/[0.09]"
            />

            <p
              ref={otherTextRef}
              className="font-inter pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center text-[14px] font-extralight tracking-[-0.02em] whitespace-nowrap text-white/88 opacity-95 sm:text-[18px] xl:text-[28px]"
            >
              Other providers
            </p>

            <div
              ref={ngiCircleRef}
              className="absolute top-1/2 left-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#3E8EE8] shadow-[0_0_28px_rgba(62,142,232,0.16)]"
            >
              <span
                ref={ngiTextRef}
                className="font-sf-pro text-[12px] leading-none font-medium tracking-[-0.04em] text-white sm:text-[18px] xl:text-[35px]"
              >
                ngi
              </span>
            </div>
          </div>
        </div>

        {/* right content */}
        <div ref={cardsStackRef} className="relative my-auto mx-auto w-full max-w-[535px] overflow-hidden sm:overflow-visible">
          {/* first card */}
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

          {/* second card */}
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
