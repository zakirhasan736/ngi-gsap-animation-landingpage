import Copy from '@/components/ui/Copy'

const CTA = () => {
  return (
    <div className="desktop:overflow-x-visible overflow-x-hidden">
      <section className="wrapper relative flex min-h-svh items-end pb-14 sm:pb-16 md:pb-20 xl:pb-[88px]">
        {/* right image */}
        <div className="pointer-events-none absolute top-[90px] right-[-250px] sm:top-[-50px] sm:right-[-300px] md:top-[-60px] md:right-[-350px] lg:top-[-80px] lg:right-[-450px] xl:top-[-120px] xl:right-[-650px]">
          <div className="relative h-[400px] w-[600px] sm:h-[600px] sm:w-[800px] md:h-[700px] md:w-[900px] xl:h-[953px] xl:w-[1400px]">
            <img src="/images/cta-img.webp" alt="cta-bg" className="h-full w-full object-contain object-top-right" />
          </div>
        </div>

        {/* cta content */}
        <div className="relative z-10 max-w-[300px] sm:max-w-[420px] md:max-w-[560px] lg:max-w-[700px] xl:max-w-[770px]">
          <Copy type="words">
            <h1 className="text-[42px] leading-[110%] font-medium tracking-[-0.04em] text-white sm:text-[56px] md:text-[72px] lg:text-[88px] xl:text-[105px]">
              Why not bring <span className="text-size-primary inline-block pr-[0.08em] italic">beauty</span> to the lab
            </h1>
          </Copy>
        </div>
      </section>
    </div>
  )
}

export default CTA
