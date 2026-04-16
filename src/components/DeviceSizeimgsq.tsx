'use client'

import BlurSlideReveal, { type BlurSlideRevealHandle } from '@/components/ui/BlurSlideReveal'
import { useImageSequencePlayer } from '@/hooks/useImageSequencePlayer'
import { buildNumberedFrameUrls } from '@/lib/image-sequence'
import { cn } from '@/utils/cn'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

const SIZE_FRAME_COUNT = 272

const SIZE_FRAMES = buildNumberedFrameUrls('/videos/size-video-img', SIZE_FRAME_COUNT, {
  prefix: 'ezgif-frame-',
  pad: 3,
  extension: 'webp',
})

const ENTER_THRESHOLD = 0.54
const EXIT_THRESHOLD = 0.5

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

  const { drawFrame } = useImageSequencePlayer(canvasRef, SIZE_FRAMES, {
    windowRadius: 14,
    maxCache: 56,
    layoutSizeCssRef: canvasLayoutCssRef,
  })

  useGSAP(
    () => {
      const root = rootRef.current
      const pin = pinRef.current
      const slot = rightSlotRef.current
      const wrap = canvasWrapRef.current
      const sectionTitle = sectionTitleRef.current
      const contentWrap = contentWrapRef.current
      const flexText = flexTextRef.current
      const card8 = card8Ref.current
      const card32 = card32Ref.current

      if (!root || !pin || !slot || !wrap || !sectionTitle || !contentWrap || !flexText || !card8 || !card32) return

      const mm = gsap.matchMedia()
      const lastFrame = SIZE_FRAME_COUNT - 1

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

        gsap.set(sectionTitle, {
          opacity: 0,
          y: 36,
          filter: 'blur(14px)',
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
          y: 34,
          filter: 'blur(14px)',
          willChange: 'transform,opacity,filter',
          force3D: true,
          backfaceVisibility: 'hidden',
        })

        gsap.set(card8, {
          opacity: 0,
          y: 38,
          filter: 'blur(14px)',
          willChange: 'transform,opacity,filter',
          force3D: true,
          backfaceVisibility: 'hidden',
        })

        gsap.set(card32, {
          opacity: 0,
          y: 44,
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

        const startScaleFactor = isMobile ? 0.92 : 0.75
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

        const STEP_SIZE = isMobile ? 8 : 10
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
              rotate: isMobile ? 0 : -0.24,
              y: isMobile ? 0 : -6,
              duration: 0.78,
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
            0.7
          )

          // Title appears with the left content, not before
          tl.to(
            sectionTitle,
            {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              duration: 0.7,
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
              duration: 0.66,
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
              duration: 0.76,
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
              duration: 0.82,
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
          <div className='relative z-999' ref={contentWrapRef}>
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
          className="pointer-events-none absolute [transform:translateZ(0)] overflow-hidden rounded-sm will-change-transform"
          aria-hidden
        >
          <canvas ref={canvasRef} className="block h-full w-full [transform:translateZ(0)]" />
        </div>
      </div>
    </section>
  )
}

export default DeviceSizeimgsq
