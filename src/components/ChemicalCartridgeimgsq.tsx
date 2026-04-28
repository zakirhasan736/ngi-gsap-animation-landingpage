'use client'

import BlurSlideReveal, { type BlurSlideRevealHandle } from '@/components/ui/BlurSlideReveal'
import { useImageSequencePlayer } from '@/hooks/useImageSequencePlayer'
import { buildNumberedFrameUrls } from '@/lib/image-sequence'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useMemo, useRef, useState } from 'react'

gsap.registerPlugin(ScrollTrigger)

const CARTRIDGE_FRAME_COUNT = 84

const CARTRIDGE_FRAMES = buildNumberedFrameUrls('/videos/chemical-cartridge-video-img', CARTRIDGE_FRAME_COUNT, {
  prefix: 'ezgif-frame-',
  pad: 3,
  extension: 'webp',
})

/**
 * Frame sequence scrolls until ENTER_THRESHOLD.
 * After that, the move-right + content reveal plays automatically.
 */
const ENTER_THRESHOLD = 0.54

/**
 * Reverse starts almost immediately when user scrolls up.
 * This removes the 4–5 wheel-scroll "free scroll" feeling.
 */
const REVERSE_TRIGGER = 0.235

/**
 * Once fully below this, the section is definitely back in frame-scrub mode.
 */
const EXIT_THRESHOLD = 0.5

const LEFT_BLUR_SEGMENTS = [
  { start: 0.16, end: 0.52, y: 28, blurPx: 12 },
  { start: 0.28, end: 0.82, y: 40, blurPx: 12 },
] as const

const ChemicalCartridgeimgsq = () => {
  const rootRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const rightSlotRef = useRef<HTMLDivElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const contentRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const blurRevealRef = useRef<BlurSlideRevealHandle>(null)

  const canvasLayoutCssRef = useRef<{ w: number; h: number } | null>(null)
  const transitionTlRef = useRef<gsap.core.Timeline | null>(null)

  const isExpandedRef = useRef(false)
  const isTabHiddenRef = useRef(false)
  const isSectionActiveRef = useRef(false)
  const firstFrameDrawnRef = useRef(false)

  const [isNearSection, setIsNearSection] = useState(false)

  /**
   * Only activate the heavy sequence before user reaches this section.
   * Frame 0 still loads instantly.
   */
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

  /**
   * Pause work when tab is hidden.
   */
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
      windowRadius: isNearSection ? 12 : 1,
      maxCache: isNearSection ? 42 : 3,
      preloadAll: false,
      preloadConcurrency: isNearSection ? 3 : 1,
      maxDpr: 1.5,
      layoutSizeCssRef: canvasLayoutCssRef,
    }),
    [isNearSection]
  )

  const { drawFrame } = useImageSequencePlayer(
    canvasRef,
    isNearSection ? CARTRIDGE_FRAMES : CARTRIDGE_FRAMES.slice(0, 1),
    playerOptions
  )

  /**
   * Draw frame 0 immediately so canvas never appears blank.
   */
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

      const startScaleFactor = isMobile ? 0.92 : 0.52
      const startW = Math.min(pr.width * startScaleFactor, 1408)
      const startH = startW * (slotH / Math.max(slotW, 1))
      const startLeft = (pr.width - startW) / 2
      const startTop = (pr.height - startH) / 2

      canvasLayoutCssRef.current = {
        w: Math.max(startW, slotW),
        h: Math.max(startH, slotH),
      }

      gsap.set(wrap, {
        position: 'absolute',
        left: startLeft,
        top: startTop,
        width: startW,
        height: startH,
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
      const content = contentRef.current
      const title = titleRef.current
      const body = bodyRef.current

      if (!root || !pin || !slot || !wrap || !content || !title || !body) return

      const mm = gsap.matchMedia()
      const lastFrame = CARTRIDGE_FRAME_COUNT - 1

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

        gsap.set(content, {
          opacity: 0,
          force3D: true,
          backfaceVisibility: 'hidden',
          willChange: 'opacity,transform',
        })

        gsap.set(title, {
          opacity: 0,
          y: 34,
          filter: 'blur(10px)',
          willChange: 'transform,opacity,filter',
          force3D: true,
          backfaceVisibility: 'hidden',
        })

        gsap.set(body, {
          opacity: 0,
          y: 44,
          filter: 'blur(10px)',
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

        const startScaleFactor = isMobile ? 0.92 : 0.52
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

        const STEP_SIZE = isMobile ? 20 : 1
        const PROGRESS_LERP = isMobile ? 0.2 : 0.14
        const FRAME_LERP = isMobile ? 0.32 : 0.22

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
            onComplete: () => {
              gsap.set([title, body, content], { willChange: 'auto' })
            },
            onReverseComplete: () => {
              blurRevealRef.current?.setProgress(0)

              gsap.set([title, body, content], {
                willChange: 'transform,opacity,filter',
              })
            },
          })

          gsap.set(wrap, {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
          })

          tl.to(
            wrap,
            {
              x: deltaX,
              y: deltaY - (isMobile ? 0 : 6),
              scaleX,
              scaleY,
              duration: 0.72,
              ease: 'expo.inOut',
              force3D: true,
            },
            0
          )

          tl.to(
            wrap,
            {
              y: deltaY,
              duration: 0.22,
              ease: 'back.out(1.04)',
              force3D: true,
            },
            0.72
          )

          tl.to(content, { opacity: 1, duration: 0.01 }, 0.24)

          tl.to(
            title,
            {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              duration: 0.64,
              ease: 'power3.out',
            },
            0.28
          )

          tl.to(
            body,
            {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              duration: 0.72,
              ease: 'power3.out',
            },
            0.4
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

          isExpandedRef.current = false

          gsap.set([title, body, content], {
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
          end: () => `+=${Math.round(window.innerHeight * (isMobile ? 2.65 : 3.25))}`,
          pin,
          pinSpacing: true,
          scrub: isMobile ? 0.28 : 0.22,
          anticipatePin: 1,
          fastScrollEnd: true,
          invalidateOnRefresh: true,

          onEnter: () => {
            isSectionActiveRef.current = true
          },

          onEnterBack: () => {
            isSectionActiveRef.current = true
          },

          onLeave: () => {
            isSectionActiveRef.current = false
            stopTick()
          },

          onLeaveBack: () => {
            isSectionActiveRef.current = false
            stopTick()
          },

          onUpdate: (self) => {
            if (isTabHiddenRef.current) return

            const tl = transitionTlRef.current
            if (!tl) return

            /**
             * Important fix:
             * When scrolling up, reverse immediately after passing below REVERSE_TRIGGER.
             * Do not wait until EXIT_THRESHOLD.
             */
            if (isExpandedRef.current && self.direction === -1 && self.progress < REVERSE_TRIGGER) {
              reverseExpandedTimeline()
              return
            }

            /**
             * Normal frame-control zone.
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
             * Small buffer zone.
             * When scrolling down, avoid flicker.
             * When scrolling up and expanded, reverse already handled above.
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
            lockToLastFrame()

            if (!isExpandedRef.current) {
              isExpandedRef.current = true
              tl.play(0)
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
      <div ref={pinRef} className="wrapper relative min-h-[72vh] overflow-hidden lg:min-h-[min(900px,92vh)]">
        <div className="relative grid min-h-[650px] grid-cols-1 items-center lg:grid-cols-2 xl:min-h-[900px]">
          <div ref={contentRef} className="z-10 order-2 flex flex-col justify-center lg:order-1">
            <BlurSlideReveal
              ref={blurRevealRef}
              mode="controlled"
              segments={[...LEFT_BLUR_SEGMENTS]}
              y={40}
              blurPx={12}
              className="flex flex-col gap-4 text-center sm:gap-8 lg:text-left xl:gap-12"
            >
              <h3
                ref={titleRef}
                className="font-sf-pro text-[36px] leading-[128%] font-medium tracking-[-2%] text-white will-change-[transform,opacity,filter] sm:text-[48px] xl:text-[72px]"
              >
                Chemical cartridge
              </h3>

              <div ref={bodyRef} className="will-change-[transform,opacity,filter]">
                <div className="flex items-start justify-center gap-3 md:gap-6.5 lg:justify-start">
                  <div className="bg-diamond mt-[12px] hidden h-3 w-3 shrink-0 rotate-45 rounded-[1px] lg:block" />

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
          </div>

          <div
            ref={rightSlotRef}
            className="order-1 mx-auto h-[300px] w-[300px] shrink-0 sm:h-[400px] sm:w-[500px] lg:order-2 lg:mx-0 lg:w-[500px] xl:h-[670px] xl:w-[630px]"
            aria-hidden
          />
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

export default ChemicalCartridgeimgsq
