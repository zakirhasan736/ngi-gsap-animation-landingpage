import { ClientLayout } from '@/providers'
import type { Metadata } from 'next'
import { interTight, sfPro } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ngi',
  description: 'Ngi is a platform for creating and sharing your ideas',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${interTight.variable} ${sfPro.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          as="video"
          href="./videos/intro-video-1-mobo.mp4"
          type="video/mp4"
          media="(max-width: 990px)"
        />
        <link rel="preload" as="video" href="./videos/intro-video.webm" type="video/webm" media="(min-width: 991px)" />
        <link
          rel="preload"
          as="video"
          href="./videos/size-video-1-mobo.mp4"
          type="video/mp4"
          media="(max-width: 990px)"
        />
        <link rel="preload" as="video" href="./videos/size-video.webm" type="video/webm" media="(min-width: 991px)" />
      </head>
      <ClientLayout>{children}</ClientLayout>
    </html>
  )
}
