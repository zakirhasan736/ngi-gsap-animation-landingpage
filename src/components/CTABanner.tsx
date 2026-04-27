import BlurSlideReveal from '@/components/ui/BlurSlideReveal'
import Copy from '@/components/ui/Copy'
import { HeaderLightZone } from '@/providers'
import Image from 'next/image'

const CTABanner = () => {
  return (
    <section className="bg-bg-secondary lg:min-h-svh">
      <HeaderLightZone>
        <div className="wrapper py-10 md:pt-[90px] md:pb-[60px]">
          <div data-cta-banner="" className="relative h-full w-full overflow-hidden rounded-2xl">
            <div className="h-[400px] md:h-[350px] lg:h-full">
              <Image
                src="/images/cta-banner-1.webp"
                alt="cta-banner-img"
                width={1920}
                height={1080}
                priority
                className="h-full w-full object-cover"
              />
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(178.12deg,rgba(0,0,0,0.8)_-14.13%,rgba(0,0,0,0)_73.74%)]"></div>

            {/* banner content */}
            <div className="absolute top-10 left-1/2 w-full -translate-x-1/2 text-center text-white lg:top-[62px]">
              <Copy type="words" triggerPoint="[data-cta-banner]" start="top 65%" delay={0.2}>
                <h2 className="font-sf-pro text-[36px] leading-[128%] font-medium tracking-[-2%] sm:text-[48px] xl:text-[72px]">
                  Beyond the machine
                </h2>
              </Copy>

              <BlurSlideReveal
                triggerPoint="[data-cta-banner]"
                start="top 55%"
                delay={0.65}
                y={34}
                blurPx={14}
                duration={1.35}
                ease="power3.out"
                stagger={0}
              >
                <p className="font-regular mx-auto max-w-[500px] px-4 text-[16px] leading-[140%] sm:px-0">
                  Lorem ipsum bibendum blandit mauris purus cras urna malesuada quis arcu faucibus in aenean viverra sit
                  at consectetur in ante
                </p>
              </BlurSlideReveal>
            </div>
          </div>
        </div>
      </HeaderLightZone>
    </section>
  )
}

export default CTABanner
