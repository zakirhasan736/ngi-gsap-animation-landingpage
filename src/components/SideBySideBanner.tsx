import BlurSlideReveal from '@/components/ui/BlurSlideReveal'
import Copy from '@/components/ui/Copy'
import Image from 'next/image'

const SideBySideBanner = () => {
  return (
    <section id="about" className="bg-bg-secondary scroll-mt-24 xl:min-h-svh">
      <div className="wrapper relative py-4 sm:py-10 xl:pt-[90px] xl:pb-[60px]">
        <BlurSlideReveal y={0} blurPx={0} duration={1.3} start="top 62%">
          <div data-side-by-side-banner="" className="relative w-full overflow-hidden rounded-2xl">
            <div className="h-[400px] w-full md:h-[350px] lg:h-full">
              <Image
                src="/images/side-by-side-banner-1.webp"
                alt="side-by-side-banner-img"
                width={1920}
                height={1080}
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(28.81deg,rgba(0,0,0,0.8)_-23.26%,rgba(0,0,0,0)_46.61%)]"></div>

            {/* banner content */}
            <div className="absolute bottom-6 left-6 text-white sm:bottom-8 sm:left-8 lg:bottom-[52px] lg:left-[52px]">
              <Copy type="words" triggerPoint="[data-side-by-side-banner]" start="top 62%" delay={0.2}>
                <h2 className="text-[42px] leading-[110%] font-medium tracking-[-0.02em] sm:text-[64px] lg:text-[88px] xl:text-[116px]">
                  Side by side
                </h2>
              </Copy>
              <BlurSlideReveal
                triggerPoint="[data-side-by-side-banner]"
                start="top 35%"
                delay={1.35}
                y={12}
                blurPx={5}
                duration={1.6}
                stagger={0}
              >
                <p className="mt-2 text-[14px] leading-[140%] font-light tracking-[-0.4px] sm:text-[18px] lg:text-[22px] xl:text-[25px]">
                  Size comparison to liquid handling machine
                </p>
              </BlurSlideReveal>
            </div>
          </div>
        </BlurSlideReveal>
      </div>
    </section>
  )
}

export default SideBySideBanner
