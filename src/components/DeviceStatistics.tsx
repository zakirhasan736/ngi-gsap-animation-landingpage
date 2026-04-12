import { DEVICE_STATISTICS } from '@/constants/deviceStatistics'
import BlurSlideReveal from './ui/BlurSlideReveal'

const DeviceStatistics = () => {
  return (
    <section className="wrapper min-h-svh pt-[100px]">
      <BlurSlideReveal className="mb-9" y={36} blurPx={10}>
        <h3 className="text-center text-[42px] leading-[128%] font-medium tracking-[-2%]">What is scale?</h3>
      </BlurSlideReveal>

      <div className="grid grid-cols-1 gap-x-4 gap-y-5 lg:grid-cols-2">
        {DEVICE_STATISTICS.map((item) => (
          <div
            key={item.id}
            className="border-statistics-border relative h-[340px] overflow-hidden rounded-[22px] border lg:h-[340px]"
          >
            {item.title && (
              <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 p-5 text-center">
                <h4 className="text-center text-[20px] leading-[128%] font-medium tracking-[-2%] text-white">
                  {item.title}
                </h4>
              </div>
            )}

            <div className="h-full w-full">
              <video src={item.video} muted autoPlay className="h-full w-full object-cover" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default DeviceStatistics
