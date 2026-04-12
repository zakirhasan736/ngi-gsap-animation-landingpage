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
  const otherCardRef = useRef<HTMLDivElement>(null)
  const ngiCardRef = useRef<HTMLDivElement>(null)
  const cardsStackRef = useRef<HTMLDivElement>(null)
  const pricingVideoRef = useRef<HTMLVideoElement>(null)
  const transitionPlayedRef = useRef(false)
const isMobile = typeof window !== 'undefined' && window.innerWidth < 991

const videoSrc = isMobile ? '/videos/device-pricing-circle-mobo.mp4' : '/videos/device-pricing-circle.mp4'
  useGSAP(
    () => {
      const section = sectionRef.current
      const otherCard = otherCardRef.current
      const ngiCard = ngiCardRef.current
      const stack = cardsStackRef.current
      if (!section || !otherCard || !ngiCard || !stack) return
      gsap.to(pricingVideoRef.current, {
        y: 30,
        scale: 1.08,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=250%',
          scrub: 3,
        },
      })
      const video = pricingVideoRef.current

      if (!video) return

      video.pause()

      let duration = 7

      video.addEventListener('loadedmetadata', () => {
        duration = video.duration || 7
      })
      gsap.set(video, {
        willChange: 'transform',
        force3D: true,
      })

      const videoProxy = { time: 0 }

      const fps = 30
      const frameDuration = 1 / fps

      let lastFrame = -1

      gsap.ticker.add(() => {
        const frame = Math.floor(videoProxy.time / frameDuration)

        if (frame !== lastFrame) {
          video.currentTime = frame * frameDuration
          lastFrame = frame
        }
      })

      const master = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=250%',
          scrub: 3,
          pin: true,
          anticipatePin: 1,
        },
      })

      /* VIDEO SCRUB */

      master.to(videoProxy, {
        time: duration,
        ease: 'none',
      })

      master.eventCallback('onUpdate', () => {
        const time = videoProxy.time
        const travel = stack.offsetHeight

        /* 0 → 3s */

        if (time <= 3) {
          const t = time / 3

          gsap.set(otherCard, {
            y: gsap.utils.interpolate(travel, 0, t),
            autoAlpha: t,
            scale: gsap.utils.interpolate(1.08, 1, t),
          })

          gsap.set(ngiCard, {
            y: travel,
            autoAlpha: 0,
          })
        }

        /* 3 → 5s */

        if (time > 3 && time <= 5) {
          const t = (time - 3) / 2

          gsap.set(otherCard, {
            y: gsap.utils.interpolate(0, -travel, t),
            autoAlpha: 1 - t,
          })

          gsap.set(ngiCard, {
            y: gsap.utils.interpolate(travel, 0, t),
            autoAlpha: t,
            scale: gsap.utils.interpolate(1.08, 1, t),
          })
        }

        /* 5 → 7s */

        if (time > 5) {
          gsap.set(otherCard, {
            y: -travel,
            autoAlpha: 0,
          })

          gsap.set(ngiCard, {
            y: 0,
            autoAlpha: 1,
            scale: 1,
          })
        }
      })
      const syncStackHeight = () => {
        const maxCardHeight = Math.max(otherCard.offsetHeight, ngiCard.offsetHeight)
        gsap.set(stack, { height: maxCardHeight })
      }

      const placeNgiBelowStack = () => {
        gsap.set(ngiCard, { y: stack.offsetHeight })
      }

      syncStackHeight()
      placeNgiBelowStack()
      gsap.set(otherCard, { y: 40, autoAlpha: 0, zIndex: 20 })
      gsap.set(ngiCard, { y: stack.offsetHeight, autoAlpha: 0, zIndex: 30 })

      const handleResize = () => {
        syncStackHeight()
        if (transitionPlayedRef.current) return
        placeNgiBelowStack()
      }

      window.addEventListener('resize', handleResize)

      return () => {
        // entryTrigger.kill()
        window.removeEventListener('resize', handleResize)
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
        {/* left video */}
        <div className="h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] xl:h-[575px] xl:w-[575px]">
          <video
            ref={pricingVideoRef}
            // src={videoSrc}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            // controlsList="nodownload noplaybackrate"
            className="h-full w-full object-cover"
          >
            <source src="./videos/device-pricing-circle-mobo.mp4" media="(max-width: 990px)" type="video/mp4" />
            <source src="./videos/device-pricing-circle.mp4" media="(min-width: 991px)" type="video/mp4" />
          </video>
        </div>

        {/* right content */}
        <div ref={cardsStackRef} className="relative mx-auto w-full max-w-[535px] overflow-hidden sm:overflow-visible">
          {/* other providers */}
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
                    <span className="h-2.5 w-2.5 rounded-full bg-white/45"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ngi */}
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
                      <span className="h-2.5 w-2.5 rounded-full bg-white"></span>
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
