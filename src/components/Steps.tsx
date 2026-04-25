'use client'

import { STEPS_DATA } from '@/constants'
import { cn } from '@/utils/cn'
import { BlurSlideReveal } from '.'
import { StepSlider } from './StepSlider'
import Copy from './ui/Copy'

const Steps = () => {
  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-[105px]">
      <BlurSlideReveal className="mb-6 sm:mb-7" start="top 88%" y={32} blurPx={8} duration={0.58} ease="power3.out">
        <h3 className="text-center text-[28px] leading-[128%] font-medium tracking-[-2%] sm:text-[34px] md:text-[38px] lg:text-[42px]">
          OceanSize
        </h3>
      </BlurSlideReveal>

      <div className="mb-10 bg-[linear-gradient(112.82deg,var(--color-size-primary)_-5.87%,var(--color-size-secondary)_97.76%)] py-px sm:mb-12 lg:mb-[53px]">
        <div className="bg-black py-px">
          <div className="bg-white/8">
            <div className="wrapper">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {STEPS_DATA.map((item, index) => (
                  <div
                    key={item.id}
                    className={cn(
                      'relative px-0 py-6 sm:px-6 md:px-8 lg:px-[40px] xl:px-[55px]',
                      'transform-gpu',
                      index === 0 && 'lg:pl-0',
                      index === 2 && 'lg:pr-0',

                      'sm:odd:pr-6 sm:even:pl-6 md:odd:pr-8 md:even:pl-8',

                      index === 1 && [
                        'lg:before:absolute lg:before:top-0 lg:before:left-0 lg:before:h-[34px] lg:before:w-px',
                        'lg:before:bg-[linear-gradient(112.82deg,var(--color-size-primary)_-5.87%,var(--color-size-secondary)_97.76%)]',
                        'lg:after:absolute lg:after:bottom-0 lg:after:left-0 lg:after:h-[34px] lg:after:w-px',
                        'lg:after:bg-[linear-gradient(112.82deg,var(--color-size-primary)_-5.87%,var(--color-size-secondary)_97.76%)]',
                      ]
                    )}
                  >
                    {index !== STEPS_DATA.length - 1 && (
                      <span className="absolute bottom-0 left-0 h-px w-full bg-white/10 lg:hidden" />
                    )}

                    {index % 2 === 1 && index !== STEPS_DATA.length - 1 && (
                      <>
                        <span className="absolute top-0 left-0 hidden h-[34px] w-px bg-[linear-gradient(112.82deg,var(--color-size-primary)_-5.87%,var(--color-size-secondary)_97.76%)] sm:block lg:hidden" />
                        <span className="absolute bottom-0 left-0 hidden h-[34px] w-px bg-[linear-gradient(112.82deg,var(--color-size-primary)_-5.87%,var(--color-size-secondary)_97.76%)] sm:block lg:hidden" />
                      </>
                    )}

                    {index === 1 && (
                      <>
                        <span className="absolute top-0 right-0 hidden h-[34px] w-px bg-[linear-gradient(112.82deg,var(--color-size-primary)_-5.87%,var(--color-size-secondary)_97.76%)] lg:block" />
                        <span className="absolute right-0 bottom-0 hidden h-[34px] w-px bg-[linear-gradient(112.82deg,var(--color-size-primary)_-5.87%,var(--color-size-secondary)_97.76%)] lg:block" />
                      </>
                    )}

                    <Copy type="lines" start="top 92%" delay={index * 0.05} animateOnScroll>
                      <p className="text-size-primary mb-4 text-[13px] leading-[140%] font-semibold tracking-[-0.38px] italic sm:mb-5 sm:text-[14px] lg:mb-6 lg:text-[15px]">
                        {item.step}
                      </p>
                    </Copy>

                    <BlurSlideReveal start="top 90%" y={34} blurPx={5} duration={0.58} ease="power3.out" stagger={0.04}>
                      <div className="transform-gpu will-change-[transform,opacity,filter]">
                        <h4 className="mb-2 text-[20px] leading-[140%] font-normal tracking-[-0.5px] text-white sm:text-[22px] lg:mb-3 lg:text-[24px]">
                          {item.title}
                        </h4>

                        <p className="text-step-description text-[14px] leading-[140%] font-normal tracking-[-0.3px] sm:text-[15px] lg:text-[16px]">
                          {item.description}
                        </p>
                      </div>
                    </BlurSlideReveal>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BlurSlideReveal className="mb-5 sm:mb-6" start="top 88%" y={32} blurPx={8} duration={0.58} ease="power3.out">
        <h3 className="text-center text-[26px] leading-[128%] font-normal tracking-[-2%] sm:text-[30px] md:text-[32px] lg:text-[36px]">
          Liquid handlers
        </h3>
      </BlurSlideReveal>

      <StepSlider />
    </section>
  )
}

export default Steps
