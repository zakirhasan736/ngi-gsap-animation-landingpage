'use client'

import { applyBlurSlideFromGlobalProgress, type BlurSlideSegment } from '@/lib/blur-slide'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'

gsap.registerPlugin(ScrollTrigger)

export type BlurSlideRevealHandle = {
  /** Drive animation from an external timeline (e.g. parent ScrollTrigger progress 0–1). */
  setProgress: (globalProgress: number) => void
}

type BlurSlideRevealOwnProps = {
  /** `scroll`: own ScrollTrigger. `controlled`: parent calls ref.setProgress. */
  mode?: 'scroll' | 'controlled'
  /** Default Y/blur when segment omits them (controlled) or for scroll mode. */
  y?: number
  blurPx?: number
  stagger?: number
  duration?: number
  ease?: string
  /** --- scroll mode --- */
  animateOnScroll?: boolean
  delay?: number
  trigger?: React.RefObject<HTMLElement | null> | HTMLElement | string
  triggerPoint?: string
  start?: string
  once?: boolean
  scrub?: boolean | number
  /** --- controlled mode: one entry per direct child --- */
  segments?: BlurSlideSegment[]
}

export type BlurSlideRevealProps = BlurSlideRevealOwnProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof BlurSlideRevealOwnProps | 'children'> & {
    children: ReactNode
  }

const REQUIRED_FONTS = ['Host Grotesk', 'DM Mono', 'Roslindale Variable']

async function waitForFonts() {
  try {
    await document.fonts.ready
    REQUIRED_FONTS.forEach((font) => document.fonts.check(`16px "${font}"`))
    await new Promise((resolve) => setTimeout(resolve, 100))
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
}

function resolveTriggerElement(
  trigger: BlurSlideRevealProps['trigger'],
  triggerPoint: BlurSlideRevealProps['triggerPoint'],
  fallback: HTMLElement
) {
  const selector = triggerPoint ?? (typeof trigger === 'string' ? trigger : null)
  if (typeof selector === 'string' && selector.trim().length > 0) {
    const resolvedBySelector = fallback.closest(selector) ?? document.querySelector(selector)
    if (resolvedBySelector instanceof HTMLElement) {
      return resolvedBySelector
    }
  }

  if (trigger instanceof HTMLElement) return trigger
  if (trigger && typeof trigger === 'object' && 'current' in trigger) {
    return trigger.current ?? fallback
  }

  return fallback
}

function getDirectChildElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.children).filter((n): n is HTMLElement => n instanceof HTMLElement)
}

const BlurSlideReveal = forwardRef<BlurSlideRevealHandle, BlurSlideRevealProps>(function BlurSlideReveal(
  {
    children,
    className,
    mode = 'scroll',
    y = 40,
    blurPx = 12,
    stagger = 0.12,
    duration = 0.85,
    ease = 'power2.out',
    animateOnScroll = true,
    delay = 0,
    trigger,
    triggerPoint,
    start,
    once = true,
    scrub,
    segments,
    ...divProps
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollTriggerRefs = useRef<ScrollTrigger[]>([])
  const maxScrubProgressRef = useRef(0)

  const defaultsRef = useRef({ y, blurPx })
  const segmentsRef = useRef(segments)

  useEffect(() => {
    defaultsRef.current = { y, blurPx }
    segmentsRef.current = segments
  }, [y, blurPx, segments])

  const collectChildren = useCallback(() => {
    const root = containerRef.current
    if (!root) return [] as HTMLElement[]
    return getDirectChildElements(root)
  }, [])

  const applyControlledProgress = useCallback(
    (p: number) => {
      const els = collectChildren()
      const segs = segmentsRef.current
      const d = defaultsRef.current
      if (!segs || segs.length === 0) return
      segs.forEach((seg, i) => {
        const el = els[i]
        if (el) applyBlurSlideFromGlobalProgress(el, p, seg, d)
      })
    },
    [collectChildren]
  )

  useImperativeHandle(
    ref,
    () => ({
      setProgress: (globalProgress: number) => {
        applyControlledProgress(globalProgress)
      },
    }),
    [applyControlledProgress]
  )

  useLayoutEffect(() => {
    if (mode !== 'controlled' || !segments?.length) return
    const els = collectChildren()
    const d = defaultsRef.current
    segments.forEach((seg, i) => {
      const el = els[i]
      if (el) {
        applyBlurSlideFromGlobalProgress(el, 0, seg, d)
      }
    })
  }, [mode, segments, collectChildren])

  useGSAP(
    () => {
      if (mode === 'controlled') return
      const root = containerRef.current
      if (!root) return

      let isActive = true
      const cleanup = () => {
        scrollTriggerRefs.current.forEach((st) => st.kill())
        scrollTriggerRefs.current = []
      }

      const build = async () => {
        await waitForFonts()
        if (!isActive || !containerRef.current) return
        cleanup()
        maxScrubProgressRef.current = 0

        const targetElements = getDirectChildElements(containerRef.current)
        if (targetElements.length === 0) return

        gsap.set(targetElements, {
          y: defaultsRef.current.y,
          opacity: 0,
          filter: `blur(${defaultsRef.current.blurPx}px)`,
        })

        const useScrub = scrub !== undefined && scrub !== false
        const tl = gsap.timeline({
          delay,
          paused: useScrub ? true : animateOnScroll,
        })
        targetElements.forEach((el, i) => {
          tl.to(
            el,
            {
              y: 0,
              opacity: 1,
              filter: 'blur(0px)',
              duration,
              ease,
            },
            i * stagger
          )
        })

        if (!animateOnScroll) {
          tl.play(0)
          return
        }

        const triggerElement = resolveTriggerElement(trigger, triggerPoint, containerRef.current)
        const resolvedStart = start ?? 'top 80%'

        if (useScrub) {
          const st = ScrollTrigger.create({
            trigger: triggerElement,
            start: resolvedStart,
            end: '+=120%',
            scrub: scrub === true ? 0.5 : scrub,
            onUpdate: (self) => {
              // Forward-only scrub: do not play backwards on scroll up.
              const nextProgress = Math.max(maxScrubProgressRef.current, self.progress)
              maxScrubProgressRef.current = nextProgress
              tl.progress(nextProgress).pause()
            },
            invalidateOnRefresh: true,
            refreshPriority: -1,
          })
          scrollTriggerRefs.current.push(st)
        } else {
          const st = ScrollTrigger.create({
            trigger: triggerElement,
            start: resolvedStart,
            animation: tl,
            once,
            invalidateOnRefresh: true,
            refreshPriority: -1,
          })
          scrollTriggerRefs.current.push(st)
        }
      }

      build()

      return () => {
        isActive = false
        cleanup()
      }
    },
    {
      scope: containerRef,
      dependencies: [
        mode,
        animateOnScroll,
        delay,
        duration,
        ease,
        once,
        scrub,
        stagger,
        start,
        trigger,
        triggerPoint,
        y,
        blurPx,
      ],
    }
  )

  return (
    <div ref={containerRef} className={className} data-blur-slide-reveal="" {...divProps}>
      {children}
    </div>
  )
})

BlurSlideReveal.displayName = 'BlurSlideReveal'

export default BlurSlideReveal
