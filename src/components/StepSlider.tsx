'use client'

import { LIQUID_HANDLERS_STEPS_DATA } from '@/constants'
import { ArrowRight } from '@/icons'
import { cn } from '@/utils/cn'
import { useMemo, useState } from 'react'
import { BlurSlideReveal } from '.'
import Copy from './ui/Copy'

const STEPS_PER_PAGE = 4

export const StepSlider = () => {
  const [page, setPage] = useState(0)
  const [motionKey, setMotionKey] = useState(0)

  const totalPages = Math.ceil(LIQUID_HANDLERS_STEPS_DATA.length / STEPS_PER_PAGE)

  const visibleSteps = useMemo(() => {
    const start = page * STEPS_PER_PAGE
    return LIQUID_HANDLERS_STEPS_DATA.slice(start, start + STEPS_PER_PAGE)
  }, [page])

  const remainingSteps = Math.max(LIQUID_HANDLERS_STEPS_DATA.length - (page + 1) * STEPS_PER_PAGE, 0)

  const handleNext = () => {
    setMotionKey((prev) => prev + 1)
    setPage((prev) => (prev + 1 >= totalPages ? 0 : prev + 1))
  }

  const numRowsSm = Math.ceil(visibleSteps.length / 2)

  return (
    <div className="border-step-border overflow-hidden border-y-[0.5px]">
      <div className="wrapper relative">
        <div className="flex flex-col gap-6 py-4 sm:py-0 lg:flex-row lg:items-stretch lg:gap-2.5">
          <div
            key={`${page}-${motionKey}`}
            className="steps-slider-page grid min-w-0 flex-1 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            {visibleSteps.map((item, index) => {
              const isFirst = index === 0
              const isLast = index === visibleSteps.length - 1
              const row = Math.floor(index / 2)
              const showSmRowDivider = row < numRowsSm - 1

              return (
                <div
                  key={`${item.id}-${page}-${motionKey}`}
                  className={cn(
                    'steps-slider-card relative px-0 py-6 sm:px-4 sm:py-8 sm:odd:pr-6 sm:even:pl-6 md:px-5 md:odd:pr-8 md:even:pl-8 lg:px-4 lg:py-[38px]',
                    isFirst && 'pl-0 sm:pl-0',
                    isLast && 'pr-0 sm:pr-0',
                    index === 0 && 'lg:pl-0',
                    index === visibleSteps.length - 1 && 'lg:pr-0',
                    index === 1 && 'steps-slider-card-delay-1',
                    index === 2 && 'steps-slider-card-delay-2',
                    index === 3 && 'steps-slider-card-delay-3',
                    index % 2 === 0 ? 'steps-slider-card-glide-up' : 'steps-slider-card-glide-down'
                  )}
                >
                  {/* mobile: full-width divider between stacked steps (Steps.tsx-style) */}
                  {!isLast && (
                    <span className="bg-step-border absolute bottom-0 left-0 h-[0.5px] w-full sm:hidden"></span>
                  )}

                  {/* sm–md: horizontal between rows in 2-column grid */}
                  {showSmRowDivider && (
                    <span className="bg-step-border absolute bottom-0 left-0 hidden h-[0.5px] w-full sm:block lg:hidden"></span>
                  )}

                  {/* sm–md: vertical between columns (like Steps.tsx tablet) */}
                  {index % 2 === 1 && !isLast && (
                    <>
                      <span className="bg-step-border absolute top-0 left-0 hidden h-[36px] w-[0.5px] sm:block lg:hidden" />
                      <span className="bg-step-border absolute bottom-0 left-0 hidden h-[36px] w-[0.5px] sm:block lg:hidden" />
                    </>
                  )}

                  {/* lg: vertical segments between 4 columns */}
                  {!isFirst && (
                    <>
                      <span className="bg-step-border absolute top-0 left-0 hidden h-[36px] w-[0.5px] lg:block lg:h-[48px]" />
                      <span className="bg-step-border absolute bottom-0 left-0 hidden h-[36px] w-[0.5px] lg:block lg:h-[48px]" />
                    </>
                  )}

                  {!isLast && (
                    <>
                      <span className="bg-step-border absolute top-0 right-0 hidden h-[36px] w-[0.5px] lg:block lg:h-[48px]" />
                      <span className="bg-step-border absolute right-0 bottom-0 hidden h-[36px] w-[0.5px] lg:block lg:h-[48px]" />
                    </>
                  )}

                  <Copy type="lines" start="top 92%" delay={index < STEPS_PER_PAGE ? index * 0.07 : 0} animateOnScroll>
                    <p className="text-step-title mb-4 text-[11px] leading-[140%] font-semibold tracking-[-0.32px] italic sm:mb-5 sm:text-[12px]">
                      {item.step}
                    </p>
                  </Copy>

                  <BlurSlideReveal
                    start="85% 94%"
                    scrub={0.35}
                    y={26}
                    blurPx={4}
                    duration={0.65}
                    ease="power3.out"
                    stagger={0.08}
                  >
                    <h4 className="mb-2 text-[18px] leading-[140%] font-normal tracking-[-0.43px] text-white sm:text-[19px] lg:mb-2.5 lg:text-[20px]">
                      {item.title}
                    </h4>
                  </BlurSlideReveal>

                  <BlurSlideReveal
                    start="85% 96%"
                    scrub={0.35}
                    y={22}
                    blurPx={3}
                    duration={0.6}
                    ease="power3.out"
                    stagger={0.08}
                  >
                    <p className="text-step-description text-[13px] leading-[140%] font-normal tracking-[-0.3px] sm:text-[13px] lg:tracking-[-0.5px]">
                      {item.description}
                    </p>
                  </BlurSlideReveal>
                </div>
              )
            })}
          </div>

          <div className="mb-4 flex flex-row items-center justify-between gap-4 border-t border-white/10 pt-4 sm:pt-5 lg:mb-0 lg:w-[110px] lg:flex-col lg:items-end lg:justify-center lg:border-t-0 lg:pt-0 xl:w-[130px]">
            <h4 className="text-left text-[18px] leading-[140%] font-semibold tracking-[-0.5px] text-white italic sm:text-[20px] lg:text-center lg:text-[24px] xl:text-[27px] xl:tracking-[-0.64px]">
              {remainingSteps > 0 ? (
                <span>
                  <span className="font-inter leading-[150%] font-medium not-italic">+{remainingSteps} </span>
                  Steps
                </span>
              ) : (
                'Restart'
              )}
            </h4>

            <button
              type="button"
              onClick={handleNext}
              className="bg-size-primary flex h-[44px] w-[44px] items-center justify-center rounded-full p-2 sm:h-[62px] sm:w-[62px] lg:h-[66px] lg:w-[66px] lg:p-0 xl:h-[70px] xl:w-[70px]"
              aria-label="Show next steps"
            >
              <ArrowRight className="h-full w-full" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
