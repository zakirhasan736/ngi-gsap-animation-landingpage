'use client'

import BlurSlideReveal from '@/components/ui/BlurSlideReveal'
import { segment01 } from '@/lib/blur-slide'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import React, { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react'

interface CopyProps {
  children: React.ReactNode
  animateOnScroll?: boolean
  delay?: number
  type?: 'blurSlide' | 'lines' | 'words'
  trigger?: React.RefObject<HTMLElement | null> | HTMLElement | string
  triggerPoint?: string
  start?: string
}

gsap.registerPlugin(SplitText, ScrollTrigger)

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
  trigger: CopyProps['trigger'],
  triggerPoint: CopyProps['triggerPoint'],
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

/** SplitText-based reveal (lines / words). */
const CopySplit = ({
  children,
  animateOnScroll = true,
  delay = 0,
  type,
  trigger,
  triggerPoint,
  start,
}: CopyProps & { type: 'lines' | 'words' }) => {
  const containerRef = useRef<HTMLElement | null>(null)
  const splitInstanceRefs = useRef<SplitText[]>([])
  const scrollTriggerRefs = useRef<ScrollTrigger[]>([])

  useGSAP(
    () => {
      if (!containerRef.current) return

      let isActive = true

      const cleanupInstances = () => {
        scrollTriggerRefs.current.forEach((st) => st?.kill())
        scrollTriggerRefs.current = []

        splitInstanceRefs.current.forEach((split) => split?.revert())
        splitInstanceRefs.current = []
      }

      const buildAnimations = async () => {
        await waitForFonts()
        if (!isActive || !containerRef.current) return

        cleanupInstances()

        const targetElements: HTMLElement[] = containerRef.current.hasAttribute('data-copy-wrapper')
          ? Array.from(containerRef.current.children).filter(
              (element): element is HTMLElement => element instanceof HTMLElement
            )
          : [containerRef.current]

        const resolvedStart = start ?? 'top 80%'
        const triggerElement = resolveTriggerElement(trigger, triggerPoint, containerRef.current)

        const resolvedType = type === 'words' ? 'words' : 'lines'
        const splitUnits: HTMLElement[] = []

        targetElements.forEach((element) => {
          const isWordSplit = resolvedType === 'words'

          const split = SplitText.create(element, {
            type: isWordSplit ? 'words' : 'lines',
            mask: isWordSplit ? 'words' : 'lines',
            ...(isWordSplit
              ? {
                  wordsClass: 'inline-block will-change-transform pr-[0.08em] mr-[-0.08em]',
                }
              : { linesClass: 'inline-block will-change-transform', lineThreshold: 0.1 }),
          })

          splitInstanceRefs.current.push(split)

          const units = ((isWordSplit ? split.words : split.lines) ?? []).filter(
            (unit): unit is HTMLElement => unit instanceof HTMLElement
          )

          const computedStyle = window.getComputedStyle(element)
          const textIndent = computedStyle.textIndent
          if (textIndent && textIndent !== '0px' && units.length > 0) {
            units[0].style.paddingLeft = textIndent
            element.style.textIndent = '0'
          }

          splitUnits.push(...units)
        })

        gsap.set(splitUnits, { y: '110%' })

        const revealAnimation = gsap.to(splitUnits, {
          y: '0%',
          duration: 1,
          ease: 'power4.out',
          stagger: 0.1,
          delay,
          paused: animateOnScroll,
        })

        if (animateOnScroll) {
          const scrollTrigger = ScrollTrigger.create({
            trigger: triggerElement,
            start: resolvedStart,
            animation: revealAnimation,
            once: true,
            refreshPriority: -1,
          })
          scrollTriggerRefs.current.push(scrollTrigger)
        }
      }

      buildAnimations()

      return () => {
        isActive = false
        cleanupInstances()
      }
    },
    {
      scope: containerRef,
      dependencies: [animateOnScroll, delay, type, trigger, triggerPoint, start],
    }
  )

  return (
    <div ref={containerRef as React.Ref<HTMLDivElement>} data-copy-wrapper="">
      {children}
    </div>
  )
}

export type CopyWordsScrubHandle = {
  setProgress: (globalProgress: number) => void
}

export type CopyWordsScrubProps = {
  children: React.ReactElement
  segment: { start: number; end: number }
  delay?: number
}

/**
 * Same word split + stagger motion as `Copy` type="words", driven by parent scroll progress (0–1).
 */
export const CopyWordsScrub = forwardRef<CopyWordsScrubHandle, CopyWordsScrubProps>(function CopyWordsScrub(
  { children, segment, delay = 0 },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const splitInstanceRefs = useRef<SplitText[]>([])
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const segmentRef = useRef(segment)

  useLayoutEffect(() => {
    segmentRef.current = segment
  }, [segment])

  useImperativeHandle(
    ref,
    () => ({
      setProgress: (p: number) => {
        const tl = timelineRef.current
        if (!tl) return
        const { start, end } = segmentRef.current
        tl.progress(segment01(p, start, end))
      },
    }),
    []
  )

  useGSAP(
    () => {
      const root = containerRef.current
      if (!root) return

      let isActive = true

      const cleanup = () => {
        timelineRef.current?.kill()
        timelineRef.current = null
        splitInstanceRefs.current.forEach((s) => s.revert())
        splitInstanceRefs.current = []
      }

      const build = async () => {
        await waitForFonts()
        if (!isActive || !containerRef.current) return

        cleanup()

        const target = containerRef.current.firstElementChild
        if (!(target instanceof HTMLElement)) return

        const split = SplitText.create(target, {
          type: 'words',
          mask: 'words',
          wordsClass: 'inline-block will-change-transform pr-[0.08em] mr-[-0.08em]',
        })
        splitInstanceRefs.current.push(split)

        const units = (split.words ?? []).filter((w): w is HTMLElement => w instanceof HTMLElement)
        gsap.set(units, { y: '110%' })

        const tl = gsap.timeline({ paused: true })
        tl.to(units, {
          y: '0%',
          duration: 1,
          ease: 'power4.out',
          stagger: 0.1,
          delay,
        })
        timelineRef.current = tl
      }

      build()

      return () => {
        isActive = false
        cleanup()
      }
    },
    { scope: containerRef, dependencies: [delay] }
  )

  return (
    <div ref={containerRef} data-copy-wrapper="">
      {children}
    </div>
  )
})

CopyWordsScrub.displayName = 'CopyWordsScrub'

const Copy = ({
  children,
  animateOnScroll = true,
  delay = 0,
  type = 'blurSlide',
  trigger,
  triggerPoint,
  start,
}: CopyProps) => {
  if (type === 'blurSlide') {
    return (
      <BlurSlideReveal
        data-copy-wrapper=""
        animateOnScroll={animateOnScroll}
        delay={delay}
        trigger={trigger}
        triggerPoint={triggerPoint}
        start={start}
        y={40}
        blurPx={12}
        stagger={0.12}
        duration={0.85}
        ease="power2.out"
      >
        {children}
      </BlurSlideReveal>
    )
  }

  return (
    <CopySplit
      type={type}
      animateOnScroll={animateOnScroll}
      delay={delay}
      trigger={trigger}
      triggerPoint={triggerPoint}
      start={start}
    >
      {children}
    </CopySplit>
  )
}

export default Copy
