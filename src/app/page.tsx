import {
  ChemicalCartridge,
  CTA,
  CTABanner,
  DevicePricing,
  DeviceSize,
  DeviceStatistics,
  FeatureShowcase,
  FeatureShowCaseSlider,
  Hero,
  Preloader,
  PreOrderContact,
  SideBySideBanner,
  Steps,
} from '@/components'
import ArchScroll from '@/components/ArchScroll'
import { HeaderLightZone } from '@/providers'

const Home = () => {
  return (
    <>
      <Preloader />
      <Hero />
      <HeaderLightZone>
        <FeatureShowcase />
      </HeaderLightZone>
      <HeaderLightZone>
        <FeatureShowCaseSlider />
      </HeaderLightZone>
      <ChemicalCartridge />
      <DeviceSize />
      <HeaderLightZone>
        <SideBySideBanner />
      </HeaderLightZone>
      <DeviceStatistics />
      <Steps />
      <DevicePricing />
      <CTA />
      <CTABanner />
      <PreOrderContact />
    </>
  )
}

export default Home
