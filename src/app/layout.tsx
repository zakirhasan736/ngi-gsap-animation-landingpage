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
        <link rel="preload" as="video" href="./videos/intro-video.webm" type="video/webm" />
      </head>
      <ClientLayout>{children}</ClientLayout>
    </html>
  )
}
