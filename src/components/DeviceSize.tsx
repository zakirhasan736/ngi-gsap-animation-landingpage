'use client'

import BlurSlideReveal, { type BlurSlideRevealHandle } from '@/components/ui/BlurSlideReveal'
import { CopyWordsScrub, type CopyWordsScrubHandle } from '@/components/ui/Copy'
import { segment01 } from '@/lib/blur-slide'
import { cn } from '@/utils/cn'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Image from 'next/image'
import { useRef } from 'react'

const MOVE_START = 0
const MOVE_END = 0.42
const AUTOPLAY_MOVE_DURATION = 1.4
const AUTOPLAY_MOVE_EASE = 'power2.inOut'
const CENTER_HOLD_DURATION = 0.24
const VIDEO_IMAGE_CROSSFADE_DURATION = 0.8
const VIDEO_IMAGE_CROSSFADE_EASE = 'power3.out'
const CONTENT_REVEAL_DURATION = 2.2
const CONTENT_REVEAL_EASE = 'power1.inOut'
const VIDEO_PLAYBACK_RATE = 1
const DEVICE_SIZE_IMAGE_SRC = '/images/device-size-img-1.png'
const isMobile = typeof window !== 'undefined' && window.innerWidth < 991

const videoSrc = isMobile ? '/videos/size-video-1-mobo.mp4' : '/videos/size-video.webm'
const H2_WORDS_START = 0.08
const H2_WORDS_END = 0.38

const BLUR_FLEX_START = 0.26
const BLUR_FLEX_END = 0.58
const BLUR_CARD8_START = 0.44
const BLUR_CARD8_END = 0.78
const BLUR_CARD32_START = 0.62
const BLUR_CARD32_END = 0.96

const LEFT_BLUR_SEGMENTS = [
  { start: BLUR_FLEX_START, end: BLUR_FLEX_END, y: 36, blurPx: 14 },
  { start: BLUR_CARD8_START, end: BLUR_CARD8_END, y: 28, blurPx: 12 },
  { start: BLUR_CARD32_START, end: BLUR_CARD32_END, y: 28, blurPx: 12 },
] as const

const ConnectorLine = ({ staggered, className }: { staggered?: boolean; className?: string }) => (
  <div
    className={cn(
      'pointer-events-none absolute top-1/2 left-full z-10 hidden h-px w-[92px] -translate-y-1/2 lg:block xl:w-[220px]',
      className
    )}
  >
    <div className="absolute inset-0 bg-white/15"></div>
    <div
      className={cn(
        'connector-shimmer-mask animate-connector-shimmer absolute inset-0 bg-white',
        staggered && 'connector-shimmer-stagger'
      )}
    />
    <div
      className={cn(
        'connector-shimmer-mask animate-connector-shimmer absolute inset-0 bg-white',
        staggered ? 'connector-shimmer-stagger-echo' : 'connector-shimmer-echo'
      )}
    />
  </div>
)

const DeviceSize = () => {
  const rootRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const rightSlotRef = useRef<HTMLDivElement>(null)
  const videoWrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const blurRevealRef = useRef<BlurSlideRevealHandle>(null)
  const wordsRef = useRef<CopyWordsScrubHandle>(null)
  const progressRef = useRef(0)
  const hasPlayedInViewRef = useRef(false)
  const lastScrollYRef = useRef(0)
  const isScrollingUpRef = useRef(false)

  useGSAP(
    () => {
      const layoutCache = {
        startLeft: 0,
        startTop: 0,
        startW: 0,
        startH: 0,
        slotLeft: 0,
        slotTop: 0,
        slotW: 0,
        slotH: 0,
      }
      const measureLayout = () => {
        const pinEl = pinRef.current
        const slotEl = rightSlotRef.current
        if (!pinEl || !slotEl) return

        const pr = pinEl.getBoundingClientRect()
        const sr = slotEl.getBoundingClientRect()

        if (pr.width < 1 || pr.height < 1 || sr.width < 1) return

        layoutCache.slotLeft = sr.left - pr.left
        layoutCache.slotTop = sr.top - pr.top
        layoutCache.slotW = 745
        layoutCache.slotH = sr.height

        layoutCache.startW = Math.min(pr.width * 0.92, 1408)
        layoutCache.startH = layoutCache.startW * (layoutCache.slotH / Math.max(layoutCache.slotW, 1))
        layoutCache.startLeft = (pr.width - layoutCache.startW) / 2
        layoutCache.startTop = (pr.height - layoutCache.startH) / 2
      }
      const root = rootRef.current
      const pin = pinRef.current
      const slot = rightSlotRef.current
      const wrap = videoWrapRef.current
      const video = videoRef.current
      const image = imageRef.current

      if (!root || !pin || !slot || !wrap || !video || !image) return
      const warmupVideo = () => {
        video.preload = 'auto'
        video.load()
        const onResize = () => {
          measureLayout()
          applyProgress(progressRef.current)
        }
        const playPromise = video.play()

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              video.pause()
              video.currentTime = 0
            })
            .catch(() => {
              video.pause()
              video.currentTime = 0
            })
        }
      }
      video.preload = 'auto'
      video.load()
      warmupVideo()
      progressRef.current = 0
      hasPlayedInViewRef.current = false
      wordsRef.current?.setProgress(0)
      blurRevealRef.current?.setProgress(0)
      video.currentTime = 0
      video.playbackRate = VIDEO_PLAYBACK_RATE
      gsap.set(video, { opacity: 1, autoAlpha: 1 })
      gsap.set(image, { autoAlpha: 0 })
      gsap.set(videoWrapRef.current, {
        force3D: true,
      })
      gsap.fromTo(
        videoWrapRef.current,
        { scale: 1 },
        {
          scale: 1.08,
          duration: 6,
          ease: 'none',
        }
      )

      const applyVideoLayout = (p: number) => {
        const isDesktop = window.innerWidth >= 1024

        const pr = pin.getBoundingClientRect()
        const sr = slot.getBoundingClientRect()

        if (pr.width < 1 || pr.height < 1 || sr.width < 1) return

        const slotLeft = sr.left - pr.left
        const slotTop = sr.top - pr.top
        const slotW = 745
        const slotH = sr.height

        const startW = Math.min(pr.width * 0.92, 1408)
        const startH = startW * (slotH / Math.max(slotW, 1))
        const startLeft = (pr.width - startW) / 2
        const startTop = (pr.height - startH) / 2

        /* MOBILE / TABLET */
        if (!isDesktop) {
          gsap.set(wrap, {
            position: 'relative',
            left: 'auto',
            top: 'auto',
            width: '100%',
            height: 'auto',
            scale: 1,
            zIndex: 1,
            clearProps: 'top,left',
          })
          return
        }

        /* DESKTOP ANIMATION */

        const raw = p < MOVE_START ? 0 : p >= MOVE_END ? 1 : segment01(p, MOVE_START, MOVE_END)

        const u = gsap.parseEase('power4.out')(raw)

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
          zIndex: u < 1 ? 30 : 20,
          force3D: true,
          duration: 0.45,
          ease: 'elastic.out(1,0.6)',
        })
      }

      const applyProgress = (p: number) => {
        const nextProgress = gsap.utils.clamp(0, 1, p)
        progressRef.current = nextProgress

        applyVideoLayout(nextProgress)

        const revealProgress = segment01(nextProgress, MOVE_END, 1)
        wordsRef.current?.setProgress(revealProgress)
        blurRevealRef.current?.setProgress(revealProgress)
      }

      const moveState = { progress: 0 }
      const revealState = { progress: 0 }
      let moveTween: gsap.core.Tween | null = null
      let revealTween: gsap.core.Tween | null = null
      let holdTween: gsap.core.Tween | null = null
      let crossfadeTimeline: gsap.core.Timeline | null = null
      let hasStartedPostVideoAnimation = false
              const moveY = window.innerHeight * 0.18

      const runPostVideoAnimation = () => {
        if (hasStartedPostVideoAnimation) return
        hasStartedPostVideoAnimation = true

        video.pause()

        moveTween?.kill()
        revealTween?.kill()
        holdTween?.kill()
        crossfadeTimeline?.kill()
        gsap.to(videoWrapRef.current, {
          scale: 1,
          duration: 0.5,
          ease: 'power2.out',
        })
        // small cinematic hold
        holdTween = gsap.delayedCall(CENTER_HOLD_DURATION, () => {
          if (window.innerWidth >= 1024) {
            // MAGNETIC MOVE
            moveTween = gsap.to(moveState, {
              progress: MOVE_END,
              duration: 1.25,
              ease: 'power4.out',
              overwrite: true,
              onUpdate: () => applyProgress(moveState.progress),

              onComplete: () => {
                // crossfade AFTER movement
                crossfadeTimeline = gsap.timeline()

                crossfadeTimeline.to(
                  video,
                  {
                    opacity: 0,
                    duration: 0.7,
                    ease: 'power2.out',
                  },
                  0
                )

                crossfadeTimeline.to(
                  image,
                  {
                    autoAlpha: 1,
                    duration: 0.7,
                    ease: 'power2.out',
                  },
                  0
                )

                // elastic settle
                gsap.fromTo(
                  wrap,
                  { filter: 'blur(10px)' },
                  {
                    filter: 'blur(0px)',
                    duration: 0.8,
                    ease: 'power2.out',
                  }
                )
                gsap.fromTo(
                  wrap,
                  { scale: 1.06 },
                  {
                    scale: 1,
                    duration: 0.6,
                    ease: 'elastic.out(1,0.6)',
                  }
                )
                // start content reveal
                revealTween = gsap.to(revealState, {
                  progress: 1,
                  duration: 1.6,
                  ease: 'power4.out',
                  overwrite: true,
                  onUpdate: () => {
                    const next = MOVE_END + (1 - MOVE_END) * revealState.progress
                    applyProgress(next)
                  },
                })
              },
            })
          } else {
            const targetY = -window.innerHeight * 0.22

            crossfadeTimeline = gsap.timeline({
              defaults: { ease: 'power3.out' },

              onComplete: () => {
                const tl = gsap.timeline()

                /* STEP 2: move to top (stronger + more natural) */

                tl.to(wrap, {
                  y: targetY,
                  scale: 0.92,
                  duration: 1.2,
                  ease: 'power4.out',
                })

                /* subtle cinematic settle */

                tl.to(
                  wrap,
                  {
                    scale: 0.96,
                    duration: 0.5,
                    ease: 'elastic.out(1,0.6)',
                  },
                  '-=0.4'
                )

                /* STEP 3: reveal content AFTER layout shift */

              tl.to(revealState, {
                progress: 1,
                duration: 1.2,
                ease: 'power3.out',
                onUpdate: () => {
                  wordsRef.current?.setProgress(revealState.progress)
                  blurRevealRef.current?.setProgress(revealState.progress)
                },
              })

              tl.add(() => {
                hasPlayedInViewRef.current = true

                // LOCK final UI state
                wordsRef.current?.setProgress(1)
                blurRevealRef.current?.setProgress(1)

                gsap.set(video, { opacity: 0 })
                gsap.set(image, { autoAlpha: 1 })
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
              },
              0
            )
          }
        })
      }
      const playSequence = () => {
        hasPlayedInViewRef.current = true
        moveTween?.kill()
        revealTween?.kill()
        holdTween?.kill()
        crossfadeTimeline?.kill()
        crossfadeTimeline = null
        hasStartedPostVideoAnimation = false
        moveState.progress = 0
        revealState.progress = 0
        progressRef.current = 0
        applyProgress(0)
        video.currentTime = 0
        video.playbackRate = VIDEO_PLAYBACK_RATE

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

        gsap.set(video, { opacity: 1, autoAlpha: 1 })
        gsap.set(image, { autoAlpha: 0 })
        const onVideoEnded = () => runPostVideoAnimation()
        video.addEventListener('ended', onVideoEnded, { once: true })
        void video.play().catch(() => {
          runPostVideoAnimation()
        })
      }

      const resetSequence = () => {
        hasPlayedInViewRef.current = false
        moveTween?.kill()
        revealTween?.kill()
        holdTween?.kill()
        crossfadeTimeline?.kill()
        crossfadeTimeline = null
        hasStartedPostVideoAnimation = false
        moveState.progress = 0
        revealState.progress = 0
        progressRef.current = 0
        applyProgress(0)
        video.pause()
        video.currentTime = 0
        gsap.set(video, { opacity: 1, autoAlpha: 1 })
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
            if (!hasPlayedInViewRef.current) {
              playSequence()
            }
          }

          // NO reset logic at all
        },
        {
          rootMargin: '0px 0px -25% 0px',
          threshold: 0.1,
        }
      )

      applyProgress(0)
      observer.observe(root)
      window.addEventListener('scroll', onScroll, { passive: true })

      const onResize = () => applyProgress(progressRef.current)
      window.addEventListener('resize', onResize)

      return () => {
        moveTween?.kill()
        revealTween?.kill()
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

  return (
    <section ref={rootRef} className="relative">
      <div ref={pinRef} className="wrapper relative flex min-h-svh flex-col justify-center py-10">
        <div className="relative z-10 order-2 mb-4 sm:mb-6 lg:order-1 lg:mb-0 xl:mb-[43px]">
          <CopyWordsScrub ref={wordsRef} segment={{ start: H2_WORDS_START, end: H2_WORDS_END }}>
            <h2 className="font-sf-pro text-[28px] leading-[128%] font-medium tracking-[-2%] text-white sm:text-[48px] xl:text-[72px]">
              Because size matters
            </h2>
          </CopyWordsScrub>
        </div>

        <div className="contents lg:relative lg:order-2 lg:grid lg:grid-cols-[350px_1fr] lg:items-center xl:grid-cols-[428px_1fr] xl:gap-20">
          <BlurSlideReveal
            ref={blurRevealRef}
            mode="controlled"
            segments={[...LEFT_BLUR_SEGMENTS]}
            y={36}
            blurPx={12}
            className="relative z-10 order-3 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-1.5 lg:order-1 lg:grid-cols-1 lg:gap-4"
          >
            <p className="font-sf-pro mb-4 text-[20px] leading-[140%] font-medium tracking-[-0.5px] text-white will-change-[transform,opacity,filter] sm:col-span-2 sm:text-[32px] lg:col-span-1 lg:mb-0 xl:mb-6">
              Flexibility for your needs
            </p>

            <div className="relative rounded-[8px] bg-[linear-gradient(112.82deg,#3C98EE_-5.87%,#0D3459_7.76%)] p-px blur-[24] will-change-[transform,opacity,filter]">
              <div className="h-full rounded-[8px] bg-black p-px">
                <div className="h-full bg-white/8 p-6">
                  <h3 className="text-size-primary mb-[11px] text-[36px] leading-[128%] font-normal tracking-[-2%]">
                    8
                  </h3>
                  <p className="font-sf-pro text-[18px] leading-[140%] tracking-[-0.5px] text-white">
                    Lorem ipsum in nunc pulvinar pellentesque vel semper aenean sed id pharetra ultrices felis lectus
                    eget felis feugiat nibh vestibulum mi at diam dolor
                  </p>
                </div>
              </div>

              <ConnectorLine className="desktop:w-[220px] top-[200px] xl:top-1/2 xl:w-[138px]" />
            </div>

            <div className="relative rounded-[8px] bg-[linear-gradient(112.82deg,#3C98EE_-5.87%,#0D3459_7.76%)] p-px blur-[24] will-change-[transform,opacity,filter]">
              <div className="h-full rounded-[8px] bg-black p-px">
                <div className="h-full bg-white/8 p-6">
                  <h3 className="text-size-primary mb-[11px] text-[64px] leading-[128%] font-normal tracking-[-2%]">
                    32
                  </h3>
                  <p className="font-sf-pro text-[18px] leading-[140%] tracking-[-0.5px] text-white">
                    Lorem ipsum in nunc pulvinar pellentesque vel semper aenean sed id pharetra ultrices felis lectus
                    eget felis feugiat nibh vestibulum mi at diam dolor
                  </p>
                </div>
              </div>

              <ConnectorLine staggered className="top-[50px] xl:top-1/2 xl:w-[290px]" />
            </div>
          </BlurSlideReveal>

          <div className="relative order-1 mb-6 hidden justify-center lg:order-2 lg:mt-14 lg:mb-0 lg:flex lg:justify-end xl:mt-0">
            <div
              ref={rightSlotRef}
              className="h-[260px] w-full max-w-[330px] sm:h-[350px] sm:max-w-[600px] xl:h-[415px] xl:max-w-[845px]"
              aria-hidden
            />
          </div>
        </div>

        <div
          ref={videoWrapRef}
          className="pointer-events-none relative order-1 mx-auto mb-6 w-full overflow-hidden rounded-sm will-change-transform lg:absolute lg:top-0 lg:left-0 lg:h-full lg:w-full"
          aria-hidden
        >
          <video
            ref={videoRef}
            src={videoSrc}
            className="block h-full w-full object-contain"
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            controlsList="nodownload"
            poster="./videos/size-video.jpg"
          />
          <div ref={imageRef} className="absolute inset-0 md:top-10">
            <Image
              src={DEVICE_SIZE_IMAGE_SRC}
              alt=""
              fill
              className="h-full w-full max-w-[845px] object-cover"
              sizes="(min-width: 1280px) 845px, 78vw"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default DeviceSize
