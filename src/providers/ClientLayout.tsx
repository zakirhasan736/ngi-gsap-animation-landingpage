import { Header } from '@/components'
import { HeaderVariantProvider } from './HeaderVariantProvider'
import { PreloaderGateProvider } from './PreloaderGateContext'
import { SmoothScroll } from './SmoothScroll'

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <body className="relative">
        <SmoothScroll>
          <PreloaderGateProvider>
            <HeaderVariantProvider>
              <Header />
              <main>{children}</main>
            </HeaderVariantProvider>
          </PreloaderGateProvider>
        </SmoothScroll>
      </body>
    </>
  )
}

export default ClientLayout
