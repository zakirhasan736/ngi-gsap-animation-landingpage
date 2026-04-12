'use client'

import BlurSlideReveal, { type BlurSlideRevealHandle } from '@/components/ui/BlurSlideReveal'
import { segment01 } from '@/lib/blur-slide'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Image from 'next/image'
import { useRef } from 'react'

const isMobile = typeof window !== 'undefined' && window.innerWidth < 991

const videoSrc = isMobile ? '/videos/chemical-cartridge-1-mobo.mp4' : '/videos/chemical-cartridge-1.mp4'
const CARTRIDGE_IMAGE_SRC = '/images/chemical-cartridge.png'
const CARTRIDGE_VIDEO_PLAYBACK_RATE = 1
const AUTOPLAY_MOVE_DURATION = 1.4
const AUTOPLAY_MOVE_EASE = 'power2.inOut'
const CENTER_HOLD_DURATION = 0.24
/** Crossfade from video last frame to still image (parallel opacity). */
const VIDEO_IMAGE_CROSSFADE_DURATION = 0.8
const VIDEO_IMAGE_CROSSFADE_EASE = 'power3.out'

/** Then last frame flies center → right slot. */
const MOVE_START = 0.36
const MOVE_END = 0.54
const CONTENT_REVEAL_TRIGGER = MOVE_END
const CONTENT_REVEAL_DURATION = 2.2
const CONTENT_REVEAL_EASE = 'power3.out'
/** Hero-style: title (tag-like), then description (title-like). */
const TITLE_START = 0.56
const TITLE_END = 0.71
const BODY_START = 0.64
const BODY_END = 0.86

const CARTRIDGE_BLUR_SEGMENTS = [
  { start: TITLE_START, end: TITLE_END, y: 26, blurPx: 8 },
  { start: BODY_START, end: BODY_END, y: 34, blurPx: 8 },
] as const

const ChemicalCartridge = () => {
  const rootRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const rightSlotRef = useRef<HTMLDivElement>(null)
  const videoWrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const blurRevealRef = useRef<BlurSlideRevealHandle>(null)
  const diamondRef = useRef<HTMLDivElement>(null)
  const contentRevealPlayedRef = useRef(false)
  const lastScrollYRef = useRef(0)
  const isScrollingUpRef = useRef(false)

  useGSAP(
    () => {
      const root = rootRef.current
      const pin = pinRef.current
      const slot = rightSlotRef.current
      const wrap = videoWrapRef.current
      const video = videoRef.current

      const image = imageRef.current
      if (!root || !pin || !slot || !wrap || !video || !image) return
      if (!root || !pin || !slot || !wrap || !video || !image) return

      video.preload = 'auto'
      video.load()
      contentRevealPlayedRef.current = false
      blurRevealRef.current?.setProgress(0)
      video.currentTime = 0
      video.playbackRate = CARTRIDGE_VIDEO_PLAYBACK_RATE
      gsap.set(video, { opacity: 1 })
      gsap.set(image, { autoAlpha: 0 })

      const applyVideoLayout = (p: number) => {
        const isDesktop = window.innerWidth >= 1024

        const pr = pin.getBoundingClientRect()
        const sr = slot.getBoundingClientRect()

        if (pr.width < 1 || pr.height < 1 || sr.width < 1) return

        const slotLeft = sr.left - pr.left
        const slotTop = sr.top - pr.top
        const slotW = 630
        const slotH = sr.height

        const startW = Math.min(pr.width * 0.92, 1408)
        const startH = startW * (slotH / Math.max(slotW, 1))
        const startLeft = (pr.width - startW) / 2
        const startTop = (pr.height - startH) / 2

        /* MOBILE / TABLET */
          if (!isDesktop) {
            const pr = pin.getBoundingClientRect()
            const wrapH = wrap.offsetHeight || pr.height * 0.5

            const centerY = (pr.height - wrapH) / 2

            gsap.set(wrap, {
              position: 'absolute',
              top: centerY,
              left: 0,
              width: '100%',
              zIndex: 20,
            })

            return
          }

        const raw = p < MOVE_START ? 0 : p >= MOVE_END ? 1 : segment01(p, MOVE_START, MOVE_END)
        const u = gsap.parseEase('power4.out')(raw)

        const scale = gsap.utils.interpolate(1, 0.92, u)

        const left = gsap.utils.interpolate(startLeft, slotLeft, u)
        const top = gsap.utils.interpolate(startTop, slotTop, u)
        const w = gsap.utils.interpolate(startW, slotW, u)
        const h = gsap.utils.interpolate(startH, slotH, u)

        gsap.set(wrap, {
          position: 'absolute',
          left,
          top,
          width: w,
          height: h,
          scale,
          zIndex: u < 1 ? 30 : 20,
          force3D: true,
          duration: 0.45,
          ease: 'elastic.out(1,0.6)',
        })
      }

      const applyProgress = (p: number) => {
        const nextProgress = gsap.utils.clamp(0, 1, p)

        applyVideoLayout(nextProgress)

        // if (!contentRevealPlayedRef.current && nextProgress >= CONTENT_REVEAL_TRIGGER) {
        //   contentRevealPlayedRef.current = true
        //   const revealState = { progress: 0 }
        //   gsap.to(revealState, {
        //     progress: 1,
        //     duration: 1.6,
        //     ease: 'power4.out',
        //     overwrite: true,
        //     onUpdate: () => blurRevealRef.current?.setProgress(revealState.progress),
        //   })
        // }
      }

      const moveState = { progress: 0 }
      let moveTween: gsap.core.Tween | null = null
      let holdTween: gsap.core.Tween | null = null
      let crossfadeTimeline: gsap.core.Timeline | null = null
      let hasStartedPostVideoAnimation = false
      let hasPlayedInView = false

      const runPostVideoAnimation = () => {
        if (hasStartedPostVideoAnimation) return
        hasStartedPostVideoAnimation = true

        video.pause()

        moveTween?.kill()
        holdTween?.kill()
        crossfadeTimeline?.kill()

        // HOLD video briefly in center
        holdTween = gsap.delayedCall(CENTER_HOLD_DURATION, () => {
          if (window.innerWidth >= 1024) {
            // MOVE video to slot FIRST
            moveTween = gsap.to(moveState, {
              progress: MOVE_END,
              duration: AUTOPLAY_MOVE_DURATION,
              ease: 'power4.out',
              overwrite: true,
              onUpdate: () => applyProgress(moveState.progress),

              onComplete: () => {
                // AFTER movement → crossfade video → image
                crossfadeTimeline = gsap.timeline()

                crossfadeTimeline.to(
                  video,
                  {
                    opacity: 0,
                    duration: VIDEO_IMAGE_CROSSFADE_DURATION,
                    ease: VIDEO_IMAGE_CROSSFADE_EASE,
                  },
                  0
                )

                crossfadeTimeline.to(
                  image,
                  {
                    autoAlpha: 1,
                    duration: VIDEO_IMAGE_CROSSFADE_DURATION,
                    ease: VIDEO_IMAGE_CROSSFADE_EASE,
                  },
                  0
                )

                // subtle elastic settle
                gsap.to(wrap, {
                  scale: 1,
                  duration: 0.5,
                  ease: 'elastic.out(1,0.6)',
                  willChange: 'transform, filter',
                })
              },
            })
          } else {
            const targetY = -window.innerHeight * 0.22

            crossfadeTimeline = gsap.timeline({
              defaults: { ease: 'power3.out' },

              onComplete: () => {
                const tl = gsap.timeline()

                /* STEP 1: move FIRST (center → top) */

                tl.to(wrap, {
                  top: 0,
                  duration: 1.1,
                  ease: 'power4.out',
                })

                /* magnetic settle */

                tl.to(
                  wrap,
                  {
                    scale: 0.96,
                    duration: 0.4,
                    ease: 'elastic.out(1,0.6)',
                  },
                  '-=0.5'
                )

                /* STEP 2: crossfade AFTER movement */

                tl.to(
                  video,
                  {
                    opacity: 0,
                    duration: 0.6,
                    ease: 'power2.out',
                  },
                  '-=0.2'
                )

                tl.to(
                  image,
                  {
                    autoAlpha: 1,
                    duration: 0.8,
                    ease: 'power3.out',
                  },
                  '-=0.6'
                )

                /* STEP 3: show + reveal content */

                tl.to(
                  '.content-box-wrapper',
                  {
                    opacity: 1,
                    display: 'grid',
                    pointerEvents: 'auto',
                    duration: 0.6,
                    ease: 'power2.out',
                  },
                  '-=0.3'
                )

                tl.to(
                  moveState,
                  {
                    progress: 1,
                    duration: 1.2,
                    ease: 'power3.out',
                    onUpdate: () => {
                      blurRevealRef.current?.setProgress(moveState.progress)
                    },
                  },
                  '-=0.3'
                )

                /* STEP 4: lock final state */

                tl.add(() => {
                  hasPlayedInView = true

                  blurRevealRef.current?.setProgress(1)

                  gsap.set(video, { opacity: 0 })
                  gsap.set(image, { autoAlpha: 1 })

                  gsap.set(wrap, {
                    top: 0,
                    scale: 0.96,
                  })
                })
              },
            })

            /* STEP 1: cinematic crossfade */

            crossfadeTimeline.fromTo(
              video,
              { opacity: 1 },
              {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.out',
              },
              0
            )

            crossfadeTimeline.fromTo(
              image,
              { autoAlpha: 0, scale: 1.05 },
              {
                autoAlpha: 1,
                scale: 1,
                duration: 0.9,
                ease: 'power3.out',
              },
              0
            )

            /* cinematic blur → sharp */

            crossfadeTimeline.fromTo(
              wrap,
              { filter: 'blur(12px)' },
              {
                filter: 'blur(0px)',
                duration: 0.8,
                ease: 'power2.out',
              },
              0
            )
          }
        })
      }
      const playSequence = () => {
        hasPlayedInView = true
        contentRevealPlayedRef.current = false
        blurRevealRef.current?.setProgress(0)
        moveTween?.kill()
        holdTween?.kill()
        crossfadeTimeline?.kill()
        crossfadeTimeline = null
        hasStartedPostVideoAnimation = false
        moveState.progress = 0
        applyProgress(0)
        video.currentTime = 0
        video.playbackRate = CARTRIDGE_VIDEO_PLAYBACK_RATE

        const startPlayback = () => {
          video.play().catch(() => runPostVideoAnimation())
        }

        if (video.readyState >= 3) {
          startPlayback()
        } else {
          const onCanPlay = () => {
            video.removeEventListener('canplay', onCanPlay)
            startPlayback()
          }
          video.addEventListener('canplay', onCanPlay)
          video.load()
        }
        gsap.set(video, { opacity: 1 })
        gsap.set(image, { autoAlpha: 0 })
        const onVideoEnded = () => runPostVideoAnimation()
        video.addEventListener('ended', onVideoEnded, { once: true })
        void video.play().catch(() => runPostVideoAnimation())
      }

      const resetSequence = () => {
        hasPlayedInView = false
        moveTween?.kill()
        holdTween?.kill()
        crossfadeTimeline?.kill()
        crossfadeTimeline = null
        hasStartedPostVideoAnimation = false
        moveState.progress = 0
        contentRevealPlayedRef.current = false
        blurRevealRef.current?.setProgress(0)
        applyProgress(0)
        video.pause()
        video.currentTime = 0
        gsap.set(video, { opacity: 1 })
        gsap.set(image, { autoAlpha: 0 })
      }

      lastScrollYRef.current = window.scrollY
      const onScroll = () => {
        const currentY = window.scrollY
        isScrollingUpRef.current = currentY < lastScrollYRef.current
        lastScrollYRef.current = currentY
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (!entry) return

          if (entry.isIntersecting) {
            if (!hasPlayedInView) {
              playSequence()
            } else {
              // keep final state
              blurRevealRef.current?.setProgress(1)

              gsap.set(video, { opacity: 0 })
              gsap.set(image, { autoAlpha: 1 })
              gsap.set('.content-box-wrapper', {
                opacity: 1,
                display: 'grid',
                pointerEvents: 'auto',
              })
            }
          }

          const sectionMovedBelowViewport = entry.boundingClientRect.top >= window.innerHeight
          if (isScrollingUpRef.current && sectionMovedBelowViewport) {
            resetSequence()
          }
        },
        { rootMargin: '0px 0px -25% 0px', threshold: 0.1 }
      )

      observer.observe(root)
      window.addEventListener('scroll', onScroll, { passive: true })

      requestAnimationFrame(() => {
        applyProgress(0)
      })

      const onResize = () => applyProgress(moveState.progress)
      window.addEventListener('resize', onResize)

      return () => {
        moveTween?.kill()
        holdTween?.kill()
        crossfadeTimeline?.kill()
        hasStartedPostVideoAnimation = false
        video.pause()
        observer.disconnect()
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onResize)
      }
    },
    { scope: rootRef, dependencies: [] }
  )

  useGSAP(
    () => {
      const diamond = diamondRef.current
      if (!diamond) return

      gsap.to(diamond, {
        rotate: 405,
        duration: 3.6,
        ease: 'none',
        repeat: -1,
      })
      gsap.to(videoWrapRef.current, {
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
    },
    { scope: rootRef }
  )

  return (
    <section ref={rootRef} className="relative">
      <div
        ref={pinRef}
        className="wrapper relative mx-auto flex min-h-[72vh] flex-col-reverse items-center justify-center overflow-hidden pt-20 lg:block lg:min-h-[min(900px,92vh)] lg:pt-0"
      >
        <div className="relative content-box-wrapper opacity-0 hidden lg:grid  min-h-[320px] grid-cols-1 items-center lg:min-h-[650px] lg:grid-cols-2 xl:min-h-[900px]">
          <BlurSlideReveal
            ref={blurRevealRef}
            mode="controlled"
            segments={[...CARTRIDGE_BLUR_SEGMENTS]}
            y={30}
            blurPx={8}
            className="z-10 order-2 flex transform-gpu flex-col gap-4 text-center sm:gap-8 lg:order-1 lg:text-left xl:gap-12"
          >
            <h3 className="font-sf-pro text-[36px] leading-[128%] font-medium tracking-[-2%] text-white will-change-[transform,opacity,filter] sm:text-[48px] xl:text-[72px]">
              Chemical cartridge
            </h3>
            <div className="transform-gpu will-change-[transform,opacity,filter]">
              <div className="flex items-start justify-center gap-3 md:gap-6.5 lg:justify-start">
                <div
                  ref={diamondRef}
                  className="bg-diamond mt-[12px] hidden h-3 w-3 shrink-0 rotate-45 rounded-[1px] lg:block"
                ></div>
                <div className="max-w-[600px] space-y-3 text-[16px] leading-[140%] tracking-[-0.5px] text-white sm:text-[20px] lg:max-w-[500px] xl:text-[24px]">
                  <p>
                    Lorem ipsum in nunc pulvinar pellentesque vel semper aenean sed id pharetra ultrices felis lectus
                    eget felis feugiat nibh vestibulum mi at diam dolor commodo neque id purus lectus id urna sed.
                  </p>
                  <p>
                    Lorem ipsum in nunc pulvinar pellentesque vel semper aenean sed id pharetra ultrices felis lectus.
                  </p>
                </div>
              </div>
            </div>
          </BlurSlideReveal>

          {/* Layout anchor: last frame lands here (canvas is absolutely positioned over this box) */}
          <div
            ref={rightSlotRef}
            className="order-1 mx-auto hidden h-auto w-[300px] shrink-0 sm:h-auto sm:w-[500px] lg:order-2 lg:mx-0 lg:inline-block lg:w-[500px] xl:h-[670px] xl:w-[630px]"
            aria-hidden
          />
        </div>

        <div
          ref={videoWrapRef}
          className="pointer-events-none relative order-1 mx-auto flex w-full items-center justify-center overflow-hidden lg:absolute lg:top-0 lg:left-0 lg:h-full lg:min-h-[60vh] lg:w-full"
          aria-hidden
        >
          <video
            ref={videoRef}
            className="block h-full w-full object-contain"
            // src={videoSrc}
            width={1408}
            height={792}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            // controlsList="nodownload"
            // poster="./videos/chemical-cartridge.jpg"
          >
            <source src="./videos/chemical-cartridge-1-mobo.mp4" media="(max-width: 990px)" type="video/mp4" />
            <source src="./videos/chemical-cartridge-1.mp4" media="(min-width: 991px)" type="video/webm" />
          </video>
          <div ref={imageRef} className="absolute inset-0">
            <Image
              src={CARTRIDGE_IMAGE_SRC}
              alt=""
              fill
              className="h-full w-full object-contain md:object-cover"
              sizes="(min-width: 1280px) 630px, 78vw"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default ChemicalCartridge
