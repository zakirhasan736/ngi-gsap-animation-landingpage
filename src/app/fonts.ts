import { Inter, Inter_Tight, Space_Grotesk } from 'next/font/google'
import localFont from 'next/font/local'

export const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const interTight = Inter_Tight({
  variable: '--font-inter-tight',
  subsets: ['latin'],
})

export const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
})

export const sfPro = localFont({
  src: [
    {
      path: './fonts/SF-Pro.ttf',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: './fonts/SF-Pro-Italic.ttf',
      weight: '100 900',
      style: 'italic',
    },
  ],
  variable: '--font-sf-pro',
  display: 'swap',
})
