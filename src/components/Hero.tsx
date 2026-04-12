'use client'

import { ScrollDown } from '@/components'
import BlurSlideReveal, { type BlurSlideRevealHandle } from '@/components/ui/BlurSlideReveal'
import { Diamond } from '@/icons'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Image from 'next/image'
import { useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

declare global {
  interface Window {
    __heroPreloaderDone?: boolean
  }
}


const isMobile = typeof window !== 'undefined' && window.innerWidth < 991

const videoSrc = isMobile ? '/videos/intro-video-1-mobo.mp4' : '/videos/intro-video.webm'
const HERO_IMAGE_SRC = '/images/hero-img.png'
const HERO_VIDEO_IMAGE_CROSSFADE_DURATION = 0.55
const HERO_VIDEO_IMAGE_CROSSFADE_EASE = 'power2.inOut'
const TAG_START = 0.1
const TAG_END = 0.42
const TITLE_START = 0.48
const TITLE_END = 0.86
const PLAYBACK_SPEED = 3
const SCROLL_LOCK_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Spacebar', 'End', 'Home'])

const HERO_BLUR_SEGMENTS = [
  { start: TAG_START, end: TAG_END, y: 36, blurPx: 14 },
  { start: TITLE_START, end: TITLE_END, y: 48, blurPx: 14 },
] as const

const Hero = () => {
  const rootRef = useRef<HTMLElement>(null)
  const mediaWrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const blurRevealRef = useRef<BlurSlideRevealHandle>(null)
  const scrollHintRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const video = videoRef.current
      const image = imageRef.current
      const mediaWrap = mediaWrapRef.current
      const scrollHint = scrollHintRef.current
      if (!video || !image || !mediaWrap) return

      blurRevealRef.current?.setProgress(0)
      gsap.set(mediaWrap, { y: 0, force3D: true })
      gsap.set([video, image], { force3D: true })
      gsap.set(video, {
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        transformPerspective: 1000,
      })
      video.setAttribute('playsinline', 'true')
      video.setAttribute('webkit-playsinline', 'true')
      gsap.set(video, { force3D: true })
      gsap.set(scrollHint, { autoAlpha: 0, y: 22 })
      video.pause()
      video.currentTime = 0
      video.muted = true
      video.playbackRate = PLAYBACK_SPEED
      gsap.set(video, { opacity: 1, autoAlpha: 1 })
      gsap.set(image, { autoAlpha: 0 })
      let hasStartedPlayback = false
      let hasStartedPostVideoTransition = false
      let isPreloaderDone = Boolean(window.__heroPreloaderDone)
      let isScrollUnlocked = false
      let crossfadeTimeline: gsap.core.Timeline | null = null

      const progressState = { value: 0 }
      const revealTl = gsap.timeline({ paused: true })
      const lockState = {
        scrollY: 0,
        htmlOverflow: '',
        bodyOverflow: '',
        bodyPosition: '',
        bodyTop: '',
        bodyWidth: '',
        bodyTouchAction: '',
      }
      const preventScroll = (event: Event) => {
        event.preventDefault()
      }
      const preventScrollKeys = (event: KeyboardEvent) => {
        if (SCROLL_LOCK_KEYS.has(event.key)) {
          event.preventDefault()
        }
      }
      const lockScroll = () => {
        lockState.scrollY = window.scrollY
        lockState.htmlOverflow = document.documentElement.style.overflow
        lockState.bodyOverflow = document.body.style.overflow
        lockState.bodyPosition = document.body.style.position
        lockState.bodyTop = document.body.style.top
        lockState.bodyWidth = document.body.style.width
        lockState.bodyTouchAction = document.body.style.touchAction

        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'
        document.body.style.position = 'fixed'
        document.body.style.top = `-${lockState.scrollY}px`
        document.body.style.width = '100%'
        document.body.style.touchAction = 'none'
        window.addEventListener('wheel', preventScroll, { passive: false })
        window.addEventListener('touchmove', preventScroll, { passive: false })
        window.addEventListener('keydown', preventScrollKeys)
      }
      const unlockScroll = () => {
        if (isScrollUnlocked) return
        isScrollUnlocked = true
        document.documentElement.style.overflow = lockState.htmlOverflow
        document.body.style.overflow = lockState.bodyOverflow
        document.body.style.position = lockState.bodyPosition
        document.body.style.top = lockState.bodyTop
        document.body.style.width = lockState.bodyWidth
        document.body.style.touchAction = lockState.bodyTouchAction
        window.removeEventListener('wheel', preventScroll)
        window.removeEventListener('touchmove', preventScroll)
        window.removeEventListener('keydown', preventScrollKeys)
        window.scrollTo(0, lockState.scrollY)
      }

      lockScroll()
      revealTl.to(mediaWrap, {
        y: -window.innerHeight * 0.35,
        force3D: true,
        duration: 1.05,
        ease: 'power2.out',
      })
      revealTl.to(
        progressState,
        {
          value: 1,
          duration: 1.1,
          ease: 'power2.out',
          onUpdate: () => blurRevealRef.current?.setProgress(progressState.value),
        },
        0
      )
      revealTl.to(
        scrollHint,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.85,
          ease: 'power2.out',
        },
        0.35
      )
      revealTl.call(unlockScroll)

      const maybeStartPlayback = () => {
        if (hasStartedPlayback || !isPreloaderDone) return
        if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return

        hasStartedPlayback = true
        hasStartedPostVideoTransition = false
        crossfadeTimeline?.kill()
        crossfadeTimeline = null
        video.currentTime = 0
        video.playbackRate = PLAYBACK_SPEED
        gsap.set(video, { opacity: 1, autoAlpha: 1 })
        gsap.set(image, { autoAlpha: 0 })
        void video.play().catch(() => {
          hasStartedPlayback = false
        })
      }
      const onCanPlay = () => {
        maybeStartPlayback()
      }
      const initScrollAnimation = () => {
        const mm = gsap.matchMedia()

        mm.add('(min-width: 991px)', () => {
          const scrollTl = gsap.timeline({
            scrollTrigger: {
              trigger: rootRef.current,
              start: 'top top',
              end: '+=120%',
              scrub: true,
              pin: true,
              anticipatePin: 1,
            },
          })

          scrollTl

            .to(
              video,
              {
                autoAlpha: 1,
                scale: 1.1,
                y: 30,
                duration: 1.2,
                ease: 'power3.out',
              },
              0
            )

            // .to(
            //   mediaWrap,
            //   {
            //     y: -window.innerHeight * 0.35,
            //     duration: 1,
            //     ease: 'none',
            //   },
            //   0
            // )
        })
      }

      const onEnded = () => {
        if (hasStartedPostVideoTransition) return
        hasStartedPostVideoTransition = true

        video.pause()

        crossfadeTimeline?.kill()

        // freeze final frame
        video.currentTime = Math.max(0, video.duration - 0.05)

        gsap.set(video, { opacity: 1, autoAlpha: 1 })
        gsap.set(image, { autoAlpha: 0, scale: 1.08 })

        crossfadeTimeline = gsap.timeline({
          defaults: { ease: 'power3.out' },
          onComplete: () => {
            crossfadeTimeline = null
          },
        })

        crossfadeTimeline

          // video fades out
          .to(
            video,
            {
              opacity: 1,
              duration: 0.7,
            },
            0
          )

          // image fades in
          // .to(
          //   image,
          //   {
          //     autoAlpha: 1,
          //     scale: 1,
          //     duration: 1,
          //   },
          //   0
          // )

          // move media upward
          .to(
            mediaWrap,
            {
              y: -window.innerHeight * 0.2,
              duration: 1.2,
            },
            0.25
          )

          // reveal content
          .to(
            progressState,
            {
              value: 1,
              duration: 1.1,
              onUpdate: () => {
                blurRevealRef.current?.setProgress(progressState.value)
              },
            },
            0.35
          )

          // show scroll hint
          .to(
            scrollHint,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
            },
            0.55
          )

          .call(() => {
            unlockScroll()
            initScrollAnimation()
          })
      }
      const onPreloaderComplete = () => {
        isPreloaderDone = true
        maybeStartPlayback()
      }
      video.addEventListener('canplay', onCanPlay)
      video.addEventListener('ended', onEnded)
      window.addEventListener('hero-preloader-complete', onPreloaderComplete)

      maybeStartPlayback()

      return () => {
        unlockScroll()
        video.removeEventListener('canplay', onCanPlay)
        video.removeEventListener('ended', onEnded)
        window.removeEventListener('hero-preloader-complete', onPreloaderComplete)
        crossfadeTimeline?.kill()
        revealTl.kill()
      }
    },
    { scope: rootRef, dependencies: [] }
  )

  return (
    <section id="intro" ref={rootRef} className="wrapper relative scroll-mt-24">
      <div className="relative min-h-svh overflow-hidden">
        <div
          ref={mediaWrapRef}
          className="desktop:h-[680px] desktop:w-[1208px] desktop:-mb-20 pointer-events-none absolute top-1/2 left-1/2 z-10  h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 transform sm:h-[350px] sm:w-[450px] md:h-[450px] md:w-[550px] xl:h-[400px] xl:w-[550px]"
          aria-hidden
        >
          <video
            ref={videoRef}
            className="block h-full w-full object-cover"
            // src={videoSrc}
            id="hero_intro_video"
            muted
            playsInline
            disablePictureInPicture
            // controlsList="nodownload noplaybackrate"
            preload="auto"
            poster="./videos/hero-video-image.jpg"
          >
            <source src="./videos/intro-video-1-mobo.mp4" media="(max-width: 990px)" type="video/mp4" />
            <source src="./videos/intro-video.webm" media="(min-width: 991px)" type="video/webm" />
          </video>
        </div>
        <div
          ref={imageRef}
          className="desktop:h-[460px] desktop:w-[720px] pointer-events-none absolute top-2/5 left-1/2 z-10 mb-10 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 transform sm:h-[350px] sm:w-[450px] md:h-[450px] md:w-[550px] xl:h-[400px] xl:w-[550px]"
          aria-hidden
        >
          <Image
            width={720}
            height={459}
            src={HERO_IMAGE_SRC}
            alt="hero-image"
            priority
            className="h-full w-full object-contain md:object-cover"
          />
        </div>

        <div className="relative z-20 flex min-h-svh flex-col justify-end pb-30 text-center md:text-left">
          <BlurSlideReveal
            ref={blurRevealRef}
            mode="controlled"
            segments={[...HERO_BLUR_SEGMENTS]}
            y={40}
            blurPx={12}
            className="flex flex-col"
          >
            <div className="mb-[11px] inline-flex self-center rounded-full bg-[linear-gradient(97.12deg,var(--color-hero-deep)_-31.59%,var(--color-hero-accent)_157.43%)] p-px will-change-[transform,opacity,filter] md:self-start">
              <div className="rounded-full bg-black p-[0.5px]">
                <div className="font-space-grotesk flex items-center gap-[10px] rounded-full bg-white/7 px-[15px] py-[7px]">
                  <Diamond />
                  <p className="text-hero-accent text-[14px] leading-none sm:text-[16px]">New Generation Instruments</p>
                </div>
              </div>
            </div>

            <h2 className="font-sf-pro mb-[20px] max-w-[530px] text-[36px] leading-[128%] font-medium tracking-[-2%] text-white will-change-[transform,opacity,filter] sm:text-[48px]">
              Introducing OceanSize, end to end sample prep for DNA sequencing
            </h2>
          </BlurSlideReveal>
        </div>

        <div
          ref={scrollHintRef}
          className="pointer-events-none absolute inset-x-0 bottom-6 isolate z-30 will-change-transform sm:bottom-10"
        >
          <ScrollDown className="flex justify-center" />
        </div>
      </div>
    </section>
  )
}

export default Hero
