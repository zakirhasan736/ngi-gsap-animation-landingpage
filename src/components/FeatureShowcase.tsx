'use client'

import { FEATURE_SHOWCASE } from '@/constants'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

/** Start reveal sooner for tighter handoff. */
const VIDEO_FADE_DELAY = 0.45
/** Balanced fade speed for better readability. */
const VIDEO_FADE_DURATION = 1.2
/** Keep reveal one-directional without vertical travel. */
const VIDEO_FADE_UP_Y = 0
/** Pull left content earlier without feeling rushed. */
const LEFT_REVEAL_OVERLAP_DESKTOP = 0.88
const BLUR_SLIDE_Y = 0
const BLUR_SLIDE_BLUR_PX = 12
const BLUR_STAGGER = 0.1
const BLUR_DURATION = 0.78
const BLUR_EASE = 'power2.out'

const videoShapes = [
  'h-[120px] w-[217px]',
  'h-[96px] w-[170px]',
  'h-[114px] w-[202px]',
  'h-[111px] w-[199px]',
  'h-[113px] w-[200px]',
]

const FeatureShowcase = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const videosRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)

  // useGSAP(
  //   () => {
  //     const videos = videosRef.current
  //     const title = titleRef.current
  //     const copy = copyRef.current
  //     if (!videos || !title || !copy) return

  //     gsap.set(videos, { opacity: 0, y: VIDEO_FADE_UP_Y })
  //     gsap.set([title, copy], {
  //       y: BLUR_SLIDE_Y,
  //       opacity: 0,
  //       filter: `blur(${BLUR_SLIDE_BLUR_PX}px)`,
  //     })

  //     const mm = gsap.matchMedia()

  //     mm.add('(min-width: 1024px)', () => {
  //       const tl = gsap.timeline({ paused: true })

  //       tl.to(
  //         videos,
  //         {
  //           opacity: 1,
  //           y: 0,
  //           duration: VIDEO_FADE_DURATION,
  //           ease: BLUR_EASE,
  //         },
  //         VIDEO_FADE_DELAY
  //       )

  //       tl.to(
  //         title,
  //         {
  //           y: 0,
  //           opacity: 1,
  //           filter: 'blur(0px)',
  //           duration: BLUR_DURATION,
  //           ease: BLUR_EASE,
  //         },
  //         `>-${LEFT_REVEAL_OVERLAP_DESKTOP}`
  //       )

  //       tl.to(
  //         copy,
  //         {
  //           y: 0,
  //           opacity: 1,
  //           filter: 'blur(0px)',
  //           duration: BLUR_DURATION,
  //           ease: BLUR_EASE,
  //         },
  //         `<${BLUR_STAGGER}`
  //       )

  //       ScrollTrigger.create({
  //         trigger: videos,
  //         start: 'top 92%',
  //         once: true,
  //         animation: tl,
  //         invalidateOnRefresh: true,
  //         refreshPriority: -1,
  //       })
  //     })

  //     mm.add('(max-width: 1023px)', () => {
  //       const tl = gsap.timeline({ paused: true })

  //       tl.to(
  //         videos,
  //         {
  //           opacity: 1,
  //           y: 0,
  //           duration: VIDEO_FADE_DURATION,
  //           ease: BLUR_EASE,
  //         },
  //         VIDEO_FADE_DELAY
  //       )

  //       tl.to(
  //         title,
  //         {
  //           y: 0,
  //           opacity: 1,
  //           filter: 'blur(0px)',
  //           duration: BLUR_DURATION,
  //           ease: BLUR_EASE,
  //         },
  //         '>-0.06'
  //       )

  //       tl.to(
  //         copy,
  //         {
  //           y: 0,
  //           opacity: 1,
  //           filter: 'blur(0px)',
  //           duration: BLUR_DURATION,
  //           ease: BLUR_EASE,
  //         },
  //         `<${BLUR_STAGGER}`
  //       )

  //       ScrollTrigger.create({
  //         trigger: title,
  //         start: 'top 92%',
  //         once: true,
  //         animation: tl,
  //         invalidateOnRefresh: true,
  //         refreshPriority: -1,
  //       })
  //     })

  //     return () => {
  //       mm.revert()
  //     }
  //   },
  //   { scope: sectionRef }
  // )
  useGSAP(
    () => {
      const videos = videosRef.current
      const title = titleRef.current
      const copy = copyRef.current
      const section = sectionRef.current

      if (!videos || !title || !copy || !section) return

      const videoItems = gsap.utils.toArray<HTMLDivElement>(videos.children)

      // initial state
      gsap.set(videoItems, {
        opacity: 0,
        y: 80,
        scale: 0.95,
      })

      gsap.set([title, copy], {
        opacity: 0,
        y: 40,
        filter: 'blur(12px)',
      })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })

      // stagger videos
      tl.to(videoItems, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.1,
        stagger: 0.1,
        ease: 'power3.out',
      })

      // title reveal
      tl.to(
        title,
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          ease: 'power3.out',
        },
        '-=0.6'
      )

      // copy reveal
      tl.to(
        copy,
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          ease: 'power3.out',
        },
        '-=0.7'
      )

    },
    { scope: sectionRef }
  )
  return (
    <section id="technology" ref={sectionRef} className="bg-bg-secondary min-h-svh scroll-mt-24 py-10">
      <div className="wrapper">
        <div className="grid h-full grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-0">
          <div className="order-1 flex justify-center lg:order-2">
            <div
              ref={videosRef}
              className="mt-10 flex flex-col items-center will-change-transform lg:mt-[170px] lg:ml-8"
            >
              {FEATURE_SHOWCASE.slice(0, 5).map((video, index) => (
                <div
                  key={video.id}
                  className={`relative overflow-hidden ${videoShapes[index]} before:bg-feature-showcase-fade-top after:bg-feature-showcase-fade-bottom before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-[38%] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-10 after:h-[38%]`}
                >
                  <video
                    src={video.video}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="order-2 flex flex-col justify-center gap-6 text-center lg:order-1 lg:gap-12 lg:text-left xl:mt-[362px] xl:justify-start">
            <h2
              ref={titleRef}
              className="font-sf-pro text-text-primary text-[48px] leading-[128%] font-medium tracking-[-2%] will-change-[transform,opacity,filter] sm:text-[64px] lg:text-[72px]"
            >
              <span className="text-text-secondary">Full</span> channel
            </h2>

            <div ref={copyRef} className="flex items-start gap-6.5 will-change-[transform,opacity,filter]">
              <div className="bg-diamond mt-[12px] hidden h-3 w-3 shrink-0 rotate-45 rounded-[1px] lg:block"></div>
              <p className="text-text-secondary mx-auto max-w-[500px] text-[20px] leading-[140%] tracking-[-0.5px] lg:mx-0 lg:text-[24px]">
                Lorem ipsum in nunc pulvinar pellentesque vel semper aenean sed id pharetra ultrices felis lectus eget
                felis feugiat{' '}
                <span className="text-text-primary-muted">
                  nibh vestibulum mi at diam dolor commodo neque id purus lectus id urna sed.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeatureShowcase
