import {
  ChemicalCartridgeimgsq,
  CTA,
  CTABanner,
  DevicePricing,
  DeviceSizeimgsq,
  DeviceStatistics,
  FeatureShowcase,
  FeatureShowCaseSlider,
  Hero,
  Preloader,
  PreOrderContact,
  SideBySideBanner,
  Steps,
} from '@/components'
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
      <ChemicalCartridgeimgsq />
      {/* <ChemicalCartridgeVideo /> */}
      <DeviceSizeimgsq />
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
