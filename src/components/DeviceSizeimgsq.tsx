'use client'

import BlurSlideReveal, { type BlurSlideRevealHandle } from '@/components/ui/BlurSlideReveal'
import { useImageSequencePlayer } from '@/hooks/useImageSequencePlayer'
import { buildNumberedFrameUrls } from '@/lib/image-sequence'
import { cn } from '@/utils/cn'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useMemo, useRef, useState } from 'react'

gsap.registerPlugin(ScrollTrigger)

const SIZE_FRAME_COUNT = 121

const SIZE_FRAMES = buildNumberedFrameUrls('/videos/size-video-img', SIZE_FRAME_COUNT, {
  prefix: 'ezgif-frame-',
  pad: 3,
  extension: 'jpg',
})

const ENTER_THRESHOLD = 0.54
const EXIT_THRESHOLD = 0.5

/**
 * Important:
 * Reverse starts almost immediately when user scrolls up from the completed pinned area.
 * This removes the 4-5 mouse-wheel dead scroll issue.
 */
const REVERSE_TRIGGER = 0.535

const LEFT_BLUR_SEGMENTS = [
  { start: 0.16, end: 0.52, y: 28, blurPx: 12 },
  { start: 0.3, end: 0.76, y: 24, blurPx: 10 },
  { start: 0.38, end: 0.84, y: 24, blurPx: 10 },
  { start: 0.12, end: 0.44, y: 30, blurPx: 12 },
] as const

const ConnectorLine = ({ staggered, className }: { staggered?: boolean; className?: string }) => (
  <div
    className={cn(
      'pointer-events-none absolute top-1/2 left-full z-40 hidden h-px w-[92px] -translate-y-1/2 lg:block xl:w-[220px]',
      className
    )}
  >
    <div className="absolute inset-0 bg-white/15" />

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

const DeviceSizeimgsq = () => {
  const rootRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const rightSlotRef = useRef<HTMLDivElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const blurRevealRef = useRef<BlurSlideRevealHandle>(null)

  const sectionTitleRef = useRef<HTMLHeadingElement>(null)
  const contentWrapRef = useRef<HTMLDivElement>(null)
  const flexTextRef = useRef<HTMLParagraphElement>(null)
  const card8Ref = useRef<HTMLDivElement>(null)
  const card32Ref = useRef<HTMLDivElement>(null)

  const canvasLayoutCssRef = useRef<{ w: number; h: number } | null>(null)
  const transitionTlRef = useRef<gsap.core.Timeline | null>(null)

  const isExpandedRef = useRef(false)
  const isTabHiddenRef = useRef(false)
  const isSectionActiveRef = useRef(false)
  const firstFrameDrawnRef = useRef(false)

  const [isNearSection, setIsNearSection] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearSection(true)
          observer.disconnect()
        }
      },
      {
        root: null,
        rootMargin: '2200px 0px 2200px 0px',
        threshold: 0.01,
      }
    )

    observer.observe(root)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const onVisibilityChange = () => {
      isTabHiddenRef.current = document.hidden

      if (!document.hidden) {
        requestAnimationFrame(() => {
          ScrollTrigger.refresh()
        })
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  const playerOptions = useMemo(
    () => ({
      windowRadius: isNearSection ? 14 : 1,
      maxCache: isNearSection ? 56 : 3,
      preloadAll: false,
      preloadConcurrency: isNearSection ? 3 : 1,
      maxDpr: 1.5,
      layoutSizeCssRef: canvasLayoutCssRef,
    }),
    [isNearSection]
  )

  const { drawFrame } = useImageSequencePlayer(
    canvasRef,
    isNearSection ? SIZE_FRAMES : SIZE_FRAMES.slice(0, 1),
    playerOptions
  )

  useEffect(() => {
    const pin = pinRef.current
    const slot = rightSlotRef.current
    const wrap = canvasWrapRef.current

    if (!pin || !slot || !wrap) return
    if (firstFrameDrawnRef.current) return

    let rafId = 0
    let tries = 0

    const drawInitialFrame = () => {
      tries += 1

      const pr = pin.getBoundingClientRect()
      const sr = slot.getBoundingClientRect()

      if (pr.width < 1 || pr.height < 1 || sr.width < 1 || sr.height < 1) {
        if (tries < 60) {
          rafId = requestAnimationFrame(drawInitialFrame)
        }

        return
      }

      const isMobile = window.innerWidth < 1024

      const slotW = sr.width
      const slotH = sr.height

      const startScaleFactor = isMobile ? 0.92 : 0.75
      const startW = Math.min(pr.width * startScaleFactor, 1408)
      const startH = startW * (slotH / Math.max(slotW, 1))
      const startLeft = (pr.width - startW) / 2
      const startTop = (pr.height - startH) / 2

      const maxCssW = Math.max(startW, slotW)
      const maxCssH = Math.max(startH, slotH)

      canvasLayoutCssRef.current = {
        w: maxCssW,
        h: maxCssH,
      }

      gsap.set(wrap, {
        position: 'absolute',
        left: startLeft,
        top: startTop,
        width: startW,
        height: startH,
        borderRadius: 10,
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        zIndex: 30,
        opacity: 1,
        force3D: true,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        transformOrigin: '50% 50%',
      })

      drawFrame(0)
      firstFrameDrawnRef.current = true
    }

    rafId = requestAnimationFrame(drawInitialFrame)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [drawFrame])

  useGSAP(
    () => {
      if (!isNearSection) return

      const root = rootRef.current
      const pin = pinRef.current
      const slot = rightSlotRef.current
      const wrap = canvasWrapRef.current
      const sectionTitle = sectionTitleRef.current
      const contentWrap = contentWrapRef.current
      const flexText = flexTextRef.current
      const card8 = card8Ref.current
      const card32 = card32Ref.current

      if (!root || !pin || !slot || !wrap || !sectionTitle || !contentWrap || !flexText || !card8 || !card32) {
        return
      }

      const mm = gsap.matchMedia()
      const lastFrame = SIZE_FRAME_COUNT - 1

      const setBaseStates = () => {
        gsap.set(wrap, {
          position: 'absolute',
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          rotate: 0,
          filter: 'none',
          transformOrigin: '50% 50%',
          transformPerspective: 1000,
          force3D: true,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        })

        gsap.set(sectionTitle, {
          opacity: 0,
          y: 32,
          filter: 'blur(10px)',
          force3D: true,
          backfaceVisibility: 'hidden',
          willChange: 'transform,opacity,filter',
        })

        gsap.set(contentWrap, {
          opacity: 0,
          force3D: true,
          backfaceVisibility: 'hidden',
          willChange: 'opacity,transform',
        })

        gsap.set(flexText, {
          opacity: 0,
          y: 30,
          filter: 'blur(10px)',
          willChange: 'transform,opacity,filter',
          force3D: true,
          backfaceVisibility: 'hidden',
        })

        gsap.set(card8, {
          opacity: 0,
          y: 34,
          filter: 'blur(10px)',
          willChange: 'transform,opacity,filter',
          force3D: true,
          backfaceVisibility: 'hidden',
        })

        gsap.set(card32, {
          opacity: 0,
          y: 38,
          filter: 'blur(12px)',
          willChange: 'transform,opacity,filter',
          force3D: true,
          backfaceVisibility: 'hidden',
        })

        blurRevealRef.current?.setProgress(0)
      }

      const buildMetrics = (isMobile: boolean) => {
        const pr = pin.getBoundingClientRect()
        const sr = slot.getBoundingClientRect()

        if (pr.width < 1 || pr.height < 1 || sr.width < 1 || sr.height < 1) return null

        const slotLeft = sr.left - pr.left
        const slotTop = sr.top - pr.top
        const slotW = sr.width
        const slotH = sr.height

        const startScaleFactor = isMobile ? 0.92 : 0.75
        const startW = Math.min(pr.width * startScaleFactor, 1408)
        const startH = startW * (slotH / Math.max(slotW, 1))
        const startLeft = (pr.width - startW) / 2
        const startTop = (pr.height - startH) / 2

        return {
          slotLeft,
          slotTop,
          slotW,
          slotH,
          startW,
          startH,
          startLeft,
          startTop,
          maxCssW: Math.max(startW, slotW),
          maxCssH: Math.max(startH, slotH),
        }
      }

      const setupVariant = (isMobile: boolean) => {
        setBaseStates()

        isExpandedRef.current = false
        transitionTlRef.current?.kill()
        transitionTlRef.current = null

        const metricsRef = { current: buildMetrics(isMobile) }

        const frameState = {
          targetProgress: 0,
          currentProgress: 0,
          targetFrame: 0,
          renderedFrame: 0,
          lastDrawnFrame: -1,
          rafId: 0 as number | 0,
          ticking: false,
        }

        const STEP_SIZE = isMobile ? 4 : 2
        const PROGRESS_LERP = isMobile ? 0.2 : 0.14
        const FRAME_LERP = isMobile ? 0.32 : 0.24

        const ensureMetrics = () => {
          metricsRef.current = buildMetrics(isMobile)
          const m = metricsRef.current
          if (!m) return null

          canvasLayoutCssRef.current = {
            w: m.maxCssW,
            h: m.maxCssH,
          }

          return m
        }

        const setCanvasToStart = () => {
          const m = ensureMetrics()
          if (!m) return

          gsap.set(wrap, {
            left: m.startLeft,
            top: m.startTop,
            width: m.startW,
            height: m.startH,
            borderRadius: 10,
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            rotate: 0,
            zIndex: 30,
          })
        }

        const drawIfNeeded = (frame: number) => {
          if (isTabHiddenRef.current) return
          if (!isSectionActiveRef.current && frameState.lastDrawnFrame !== -1) return

          const clamped = Math.max(0, Math.min(lastFrame, Math.round(frame)))

          if (clamped === frameState.lastDrawnFrame) return

          frameState.lastDrawnFrame = clamped
          drawFrame(clamped)
        }

        const forceDrawFrame = (frame: number) => {
          const wasActive = isSectionActiveRef.current
          isSectionActiveRef.current = true
          drawIfNeeded(frame)
          isSectionActiveRef.current = wasActive
        }

        const buildTransitionTimeline = () => {
          transitionTlRef.current?.kill()

          const m = ensureMetrics()
          if (!m) return

          const startCenterX = m.startLeft + m.startW / 2
          const startCenterY = m.startTop + m.startH / 2
          const targetCenterX = m.slotLeft + m.slotW / 2
          const targetCenterY = m.slotTop + m.slotH / 2

          const deltaX = targetCenterX - startCenterX
          const deltaY = targetCenterY - startCenterY

          const scaleX = m.slotW / m.startW
          const scaleY = m.slotH / m.startH

          const tl = gsap.timeline({
            paused: true,
            defaults: { ease: 'power3.out' },
            onUpdate: () => {
              if (!isTabHiddenRef.current) {
                blurRevealRef.current?.setProgress(tl.progress())
              }
            },
            onStart: () => {
              gsap.set([sectionTitle, contentWrap, flexText, card8, card32], {
                willChange: 'transform,opacity,filter',
              })
            },
            onComplete: () => {
              gsap.set([sectionTitle, contentWrap, flexText, card8, card32], {
                willChange: 'auto',
              })
            },
            onReverseComplete: () => {
              blurRevealRef.current?.setProgress(0)

              gsap.set([sectionTitle, contentWrap, flexText, card8, card32], {
                willChange: 'transform,opacity,filter',
              })
            },
          })

          gsap.set(wrap, {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            rotate: 0,
          })

          tl.to(
            wrap,
            {
              x: deltaX,
              y: deltaY - (isMobile ? 0 : 8),
              scaleX,
              scaleY,
              rotate: isMobile ? 0 : -0.18,
              duration: 0.76,
              ease: 'expo.inOut',
              force3D: true,
            },
            0
          )

          tl.to(
            wrap,
            {
              y: deltaY,
              rotate: 0,
              duration: 0.24,
              ease: 'back.out(1.04)',
              force3D: true,
            },
            0.68
          )

          tl.to(
            sectionTitle,
            {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              duration: 0.64,
              ease: 'power3.out',
            },
            0.18
          )

          tl.to(
            contentWrap,
            {
              opacity: 1,
              duration: 0.01,
            },
            0.24
          )

          tl.to(
            flexText,
            {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              duration: 0.6,
              ease: 'power3.out',
            },
            0.28
          )

          tl.to(
            card8,
            {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              duration: 0.68,
              ease: 'power3.out',
            },
            0.38
          )

          tl.to(
            card32,
            {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              duration: 0.74,
              ease: 'power3.out',
            },
            0.48
          )

          transitionTlRef.current = tl
        }

        const updateTargetsFromProgress = (progress: number) => {
          const normalized = gsap.utils.clamp(0, 1, progress / ENTER_THRESHOLD)
          const eased = gsap.parseEase('power1.inOut')(normalized)
          const rawFrame = eased * lastFrame

          frameState.targetFrame = Math.min(lastFrame, Math.round(rawFrame / STEP_SIZE) * STEP_SIZE)
        }

        const stopTick = () => {
          frameState.ticking = false

          if (frameState.rafId) {
            cancelAnimationFrame(frameState.rafId)
            frameState.rafId = 0
          }
        }

        const tickFrames = () => {
          if (isTabHiddenRef.current || !isSectionActiveRef.current) {
            stopTick()
            return
          }

          frameState.currentProgress += (frameState.targetProgress - frameState.currentProgress) * PROGRESS_LERP

          if (Math.abs(frameState.targetProgress - frameState.currentProgress) < 0.0005) {
            frameState.currentProgress = frameState.targetProgress
          }

          updateTargetsFromProgress(frameState.currentProgress)

          frameState.renderedFrame += (frameState.targetFrame - frameState.renderedFrame) * FRAME_LERP

          if (Math.abs(frameState.targetFrame - frameState.renderedFrame) < 0.08) {
            frameState.renderedFrame = frameState.targetFrame
          }

          drawIfNeeded(frameState.renderedFrame)

          const stillMoving =
            Math.abs(frameState.targetProgress - frameState.currentProgress) > 0.001 ||
            Math.abs(frameState.targetFrame - frameState.renderedFrame) > 0.12

          if (stillMoving) {
            frameState.rafId = requestAnimationFrame(tickFrames)
          } else {
            stopTick()
          }
        }

        const startTick = () => {
          if (frameState.ticking) return
          if (isTabHiddenRef.current) return
          if (!isSectionActiveRef.current) return

          frameState.ticking = true
          frameState.rafId = requestAnimationFrame(tickFrames)
        }

        const applyFrameProgress = (progress: number) => {
          frameState.targetProgress = progress
          startTick()
        }

        const lockToLastFrame = () => {
          stopTick()

          frameState.targetProgress = ENTER_THRESHOLD
          frameState.currentProgress = ENTER_THRESHOLD
          frameState.targetFrame = lastFrame
          frameState.renderedFrame = lastFrame

          forceDrawFrame(lastFrame)
        }

        const reverseExpandedTimeline = () => {
          const tl = transitionTlRef.current
          if (!tl) return
          if (tl.progress() <= 0) return

          isExpandedRef.current = false

          gsap.set([sectionTitle, contentWrap, flexText, card8, card32], {
            willChange: 'transform,opacity,filter',
          })

          lockToLastFrame()
          tl.reverse()
        }

        setCanvasToStart()
        buildTransitionTimeline()

        frameState.targetProgress = 0
        frameState.currentProgress = 0
        frameState.targetFrame = 0
        frameState.renderedFrame = 0

        forceDrawFrame(0)

        const st = ScrollTrigger.create({
          trigger: root,
          start: 'top top',

          /**
           * Slightly shorter than before.
           * Less pinned dead space after the visual animation finishes.
           */
          end: () => `+=${Math.round(window.innerHeight * (isMobile ? 2.6 : 3.1))}`,

          pin,
          pinSpacing: true,
          scrub: isMobile ? 0.32 : 0.24,
          anticipatePin: 1,
          fastScrollEnd: true,
          invalidateOnRefresh: true,

          onEnter: () => {
            isSectionActiveRef.current = true
          },

          onEnterBack: () => {
            isSectionActiveRef.current = true

            /**
             * When user reaches this section from below,
             * keep completed state ready, then reverse as soon as they scroll up.
             */
            if (transitionTlRef.current && st.progress > ENTER_THRESHOLD) {
              lockToLastFrame()
              transitionTlRef.current.progress(1)
              isExpandedRef.current = true
            }
          },

          onLeave: () => {
            isSectionActiveRef.current = false
            stopTick()

            /**
             * Finish cleanly when scrolling down fast.
             */
            if (transitionTlRef.current) {
              lockToLastFrame()
              transitionTlRef.current.progress(1)
              isExpandedRef.current = true
            }
          },

          onLeaveBack: () => {
            isSectionActiveRef.current = false
            stopTick()
          },

          onUpdate: (self) => {
            if (isTabHiddenRef.current) return

            const tl = transitionTlRef.current
            if (!tl) return

            const isScrollingUp = self.direction === -1
            const isScrollingDown = self.direction === 1

            /**
             * Main fix:
             * If user scrolls up from the completed/pinned area,
             * reverse immediately instead of waiting until EXIT_THRESHOLD.
             */
            if (isScrollingUp && isExpandedRef.current && self.progress < REVERSE_TRIGGER) {
              reverseExpandedTimeline()
              return
            }

            /**
             * While timeline is reversing, keep the final frame stable until
             * user reaches the frame-scrub zone.
             */
            if (isScrollingUp && tl.reversed() && tl.isActive() && self.progress > EXIT_THRESHOLD) {
              lockToLastFrame()
              return
            }

            /**
             * Normal frame sequence zone.
             */
            if (self.progress < EXIT_THRESHOLD) {
              applyFrameProgress(self.progress)

              if (isExpandedRef.current) {
                reverseExpandedTimeline()
              } else if (tl.progress() > 0 && !tl.isActive()) {
                tl.progress(0)
              }

              return
            }

            /**
             * Small buffer between frame sequence and expanded state.
             */
            if (self.progress >= EXIT_THRESHOLD && self.progress < ENTER_THRESHOLD) {
              if (!isExpandedRef.current) {
                applyFrameProgress(self.progress)
              }

              return
            }

            /**
             * Expanded zone.
             */
            if (isScrollingDown || self.progress >= ENTER_THRESHOLD) {
              lockToLastFrame()

              if (!isExpandedRef.current) {
                isExpandedRef.current = true
                tl.play(0)
              }
            }
          },

          onRefreshInit: () => {
            ensureMetrics()
            buildTransitionTimeline()
          },

          onRefresh: (self) => {
            ensureMetrics()

            if (isExpandedRef.current) {
              lockToLastFrame()
              transitionTlRef.current?.progress(1)
            } else {
              setCanvasToStart()

              frameState.targetProgress = self.progress
              frameState.currentProgress = self.progress

              updateTargetsFromProgress(self.progress)

              frameState.renderedFrame = frameState.targetFrame

              forceDrawFrame(frameState.renderedFrame)
            }
          },
        })

        let resizeRaf = 0

        const onResize = () => {
          if (resizeRaf) cancelAnimationFrame(resizeRaf)

          resizeRaf = requestAnimationFrame(() => {
            ensureMetrics()
            buildTransitionTimeline()

            if (isExpandedRef.current) {
              lockToLastFrame()
              transitionTlRef.current?.progress(1)
            } else {
              setCanvasToStart()

              frameState.targetProgress = st.progress
              frameState.currentProgress = st.progress

              updateTargetsFromProgress(st.progress)

              frameState.renderedFrame = frameState.targetFrame

              forceDrawFrame(frameState.renderedFrame)
            }
          })
        }

        window.addEventListener('resize', onResize, { passive: true })

        requestAnimationFrame(() => {
          ensureMetrics()
          buildTransitionTimeline()
          ScrollTrigger.refresh()
        })

        return () => {
          window.removeEventListener('resize', onResize)

          if (resizeRaf) {
            cancelAnimationFrame(resizeRaf)
          }

          stopTick()
          transitionTlRef.current?.kill()
          st.kill()
        }
      }

      mm.add('(max-width: 1023px)', () => setupVariant(true))
      mm.add('(min-width: 1024px)', () => setupVariant(false))

      return () => {
        mm.revert()
      }
    },
    { scope: rootRef, dependencies: [drawFrame, isNearSection] }
  )

  return (
    <section ref={rootRef} className="relative">
      <div ref={pinRef} className="wrapper relative flex min-h-svh flex-col justify-center overflow-hidden py-10">
        <div className="relative z-10 order-2 mb-4 sm:mb-6 lg:order-1 lg:mb-0 xl:mb-[43px]">
          <h2
            ref={sectionTitleRef}
            className="font-sf-pro text-[28px] leading-[128%] font-medium tracking-[-2%] text-white sm:text-[48px] xl:text-[72px]"
          >
            Because size matters
          </h2>
        </div>

        <div className="contents lg:relative lg:order-2 lg:grid lg:grid-cols-[350px_1fr] lg:items-center xl:grid-cols-[428px_1fr] xl:gap-20">
          <div className="relative z-999" ref={contentWrapRef}>
            <BlurSlideReveal
              ref={blurRevealRef}
              mode="controlled"
              segments={[...LEFT_BLUR_SEGMENTS]}
              y={36}
              blurPx={12}
              className="relative z-40 order-3 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-1.5 lg:order-1 lg:grid-cols-1 lg:gap-4"
            >
              <p
                ref={flexTextRef}
                className="font-sf-pro mb-4 text-[20px] leading-[140%] font-medium tracking-[-0.5px] text-white will-change-[transform,opacity,filter] sm:col-span-2 sm:text-[32px] lg:col-span-1 lg:mb-0 xl:mb-6"
              >
                Flexibility for your needs
              </p>

              <div
                ref={card8Ref}
                className="relative rounded-[8px] bg-[linear-gradient(112.82deg,#3C98EE_-5.87%,#0D3459_7.76%)] p-px will-change-[transform,opacity,filter]"
              >
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

              <div
                ref={card32Ref}
                className="relative rounded-[8px] bg-[linear-gradient(112.82deg,#3C98EE_-5.87%,#0D3459_7.76%)] p-px will-change-[transform,opacity,filter]"
              >
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
          </div>

          <div className="relative z-10 order-1 mb-6 flex justify-center lg:order-2 lg:mt-14 lg:mb-0 lg:justify-end xl:mt-0">
            <div
              ref={rightSlotRef}
              className="h-[300px] w-full max-w-[380px] sm:h-[350px] sm:max-w-[600px] xl:h-[515px] xl:max-w-[845px]"
              aria-hidden
            />
          </div>
        </div>

        <div
          ref={canvasWrapRef}
          className="pointer-events-none absolute [transform:translate3d(0,0,0)] overflow-hidden rounded-sm will-change-transform"
          aria-hidden
        >
          <canvas ref={canvasRef} className="block h-full w-full [transform:translate3d(0,0,0)]" />
        </div>
      </div>
    </section>
  )
}

export default DeviceSizeimgsq
