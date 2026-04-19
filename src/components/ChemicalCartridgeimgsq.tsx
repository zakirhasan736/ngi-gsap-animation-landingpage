'use client'

import BlurSlideReveal, { type BlurSlideRevealHandle } from '@/components/ui/BlurSlideReveal'
import { useImageSequencePlayer } from '@/hooks/useImageSequencePlayer'
import { buildNumberedFrameUrls } from '@/lib/image-sequence'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

const CARTRIDGE_FRAME_COUNT = 125

const CARTRIDGE_FRAMES = buildNumberedFrameUrls('/videos/chemical-cartridge-video-img', CARTRIDGE_FRAME_COUNT, {
  prefix: 'ezgif-frame-',
  pad: 3,
  extension: 'png',
})

/**
 * Smaller threshold gap = reverse starts sooner on scroll up
 */
const ENTER_THRESHOLD = 0.54
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

  const { drawFrame } = useImageSequencePlayer(canvasRef, CARTRIDGE_FRAMES, {
    windowRadius: 12,
    maxCache: 48,
    layoutSizeCssRef: canvasLayoutCssRef,
  })

  useGSAP(
    () => {
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
          xPercent: 0,
          yPercent: 0,
          scale: 1,
          rotate: 0,
          filter: 'blur(0px)',
          transformOrigin: '50% 50%',
          transformPerspective: 1000,
          force3D: true,
          willChange: 'transform,left,top,width,height,border-radius,filter',
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
          y: 36,
          filter: 'blur(14px)',
          willChange: 'transform,opacity,filter',
          force3D: true,
          backfaceVisibility: 'hidden',
        })

        gsap.set(body, {
          opacity: 0,
          y: 54,
          filter: 'blur(16px)',
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

        const maxCssW = Math.max(startW, slotW)
        const maxCssH = Math.max(startH, slotH)

        return {
          slotLeft,
          slotTop,
          slotW,
          slotH,
          startW,
          startH,
          startLeft,
          startTop,
          maxCssW,
          maxCssH,
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
          rafId: 0 as number | 0,
        }

        const STEP_SIZE = isMobile ? 6 : 8
        const PROGRESS_LERP = isMobile ? 0.09 : 0.075
        const FRAME_LERP = isMobile ? 0.14 : 0.12

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
            scale: 1,
            rotate: 0,
            y: 0,
            zIndex: 30,
          })
        }

        const buildTransitionTimeline = () => {
          transitionTlRef.current?.kill()

          const m = ensureMetrics()
          if (!m) return

          const tl = gsap.timeline({
            paused: true,
            defaults: { ease: 'power3.out' },
            onUpdate: () => {
              blurRevealRef.current?.setProgress(tl.progress())
            },
          })

          tl.to(
            wrap,
            {
              scale: isMobile ? 1 : 0.988,
              duration: 0.12,
              ease: 'power2.out',
            },
            0
          )

          tl.to(
            wrap,
            {
              left: m.slotLeft,
              top: m.slotTop - (isMobile ? 0 : 8),
              width: m.slotW,
              height: m.slotH,
              borderRadius: 4,
              rotate: isMobile ? 0 : -0.25,
              y: isMobile ? 0 : -6,
              duration: 0.74,
              ease: 'expo.inOut',
            },
            0.05
          )

          tl.to(
            wrap,
            {
              top: m.slotTop,
              rotate: 0,
              y: 0,
              scale: 1,
              duration: 0.28,
              ease: 'back.out(1.08)',
            },
            0.66
          )

          tl.to(
            content,
            {
              opacity: 1,
              duration: 0.01,
            },
            0.24
          )

          tl.to(
            title,
            {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              duration: 0.72,
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
              duration: 0.84,
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

        const tickFrames = () => {
          frameState.currentProgress += (frameState.targetProgress - frameState.currentProgress) * PROGRESS_LERP

          if (Math.abs(frameState.targetProgress - frameState.currentProgress) < 0.0003) {
            frameState.currentProgress = frameState.targetProgress
          }

          updateTargetsFromProgress(frameState.currentProgress)

          frameState.renderedFrame += (frameState.targetFrame - frameState.renderedFrame) * FRAME_LERP

          if (Math.abs(frameState.targetFrame - frameState.renderedFrame) < 0.08) {
            frameState.renderedFrame = frameState.targetFrame
          }

          drawFrame(frameState.renderedFrame)
          frameState.rafId = window.requestAnimationFrame(tickFrames)
        }

        const applyFrameProgress = (progress: number) => {
          frameState.targetProgress = progress
        }

        setCanvasToStart()
        buildTransitionTimeline()

        frameState.targetProgress = 0
        frameState.currentProgress = 0
        frameState.targetFrame = 0
        frameState.renderedFrame = 0
        drawFrame(0)

        frameState.rafId = window.requestAnimationFrame(tickFrames)

        let st: ScrollTrigger

        st = ScrollTrigger.create({
          trigger: root,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * (isMobile ? 2.85 : 3.5))}`,
          pin,
          pinSpacing: true,
          scrub: isMobile ? 0.55 : 0.42,
          anticipatePin: 1,
          fastScrollEnd: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const tl = transitionTlRef.current
            if (!tl) return

            // reverse sooner on scroll up
            if (self.progress < EXIT_THRESHOLD) {
              applyFrameProgress(self.progress)

              if (isExpandedRef.current) {
                isExpandedRef.current = false
                tl.reverse()
              } else if (tl.progress() > 0 && !tl.isActive()) {
                tl.progress(0)
              }

              return
            }

            // very small buffer zone
            if (self.progress >= EXIT_THRESHOLD && self.progress < ENTER_THRESHOLD) {
              if (!isExpandedRef.current) {
                applyFrameProgress(self.progress)
              }
              return
            }

            frameState.targetProgress = ENTER_THRESHOLD
            frameState.targetFrame = lastFrame
            frameState.renderedFrame = lastFrame
            drawFrame(lastFrame)

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
              frameState.targetProgress = ENTER_THRESHOLD
              frameState.currentProgress = ENTER_THRESHOLD
              frameState.targetFrame = lastFrame
              frameState.renderedFrame = lastFrame
              drawFrame(lastFrame)
              transitionTlRef.current?.progress(1)
            } else {
              setCanvasToStart()
              frameState.targetProgress = self.progress
            }
          },
        })

        const onResize = () => {
          ensureMetrics()
          buildTransitionTimeline()

          if (isExpandedRef.current) {
            frameState.targetProgress = ENTER_THRESHOLD
            frameState.currentProgress = ENTER_THRESHOLD
            frameState.targetFrame = lastFrame
            frameState.renderedFrame = lastFrame
            drawFrame(lastFrame)
            transitionTlRef.current?.progress(1)
          } else {
            setCanvasToStart()
            frameState.targetProgress = st.progress
          }
        }

        window.addEventListener('resize', onResize)

        requestAnimationFrame(() => {
          ensureMetrics()
          buildTransitionTimeline()

          if (isExpandedRef.current) {
            frameState.targetProgress = ENTER_THRESHOLD
            frameState.currentProgress = ENTER_THRESHOLD
            frameState.targetFrame = lastFrame
            frameState.renderedFrame = lastFrame
            drawFrame(lastFrame)
            transitionTlRef.current?.progress(1)
          } else {
            setCanvasToStart()
            frameState.targetProgress = st.progress
          }

          ScrollTrigger.refresh()
        })

        return () => {
          window.removeEventListener('resize', onResize)
          if (frameState.rafId) window.cancelAnimationFrame(frameState.rafId)
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
    { scope: rootRef, dependencies: [drawFrame] }
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
          className="pointer-events-none absolute [transform:translateZ(0)] overflow-hidden rounded-sm will-change-transform"
          aria-hidden
        >
          <canvas ref={canvasRef} className="block h-full w-full [transform:translateZ(0)]" />
        </div>
      </div>
    </section>
  )
}

export default ChemicalCartridgeimgsq
