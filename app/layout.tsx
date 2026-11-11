import type {Metadata} from 'next'
import {Instrument_Serif, Inter} from 'next/font/google'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SmoothScroll from '@/components/layout/SmoothScroll'
import PageTransition from '@/components/layout/PageTransition'
import {site} from '@/content/site'
import './globals.css'

const serif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--serif',
})
const sans = Inter({subsets: ['latin'], variable: '--sans'})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {default: `${site.title} | ${site.desc}`, template: '%s — ZETA'},
  description:
    'Cocinamos para que algo suceda. Private Dining, Events, Pop Ups y Collaborations en Buenos Aires.',
  openGraph: {
    title: site.title,
    description: site.desc,
    type: 'website',
    locale: 'es_AR',
    images: [{url: '/og.jpg', width: 1200, height: 630}],
  },
  twitter: {card: 'summary_large_image'},
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`}>
      <body className="font-sans">
        <SmoothScroll />
        <PageTransition>
          <Header />
          {children}
          <Footer />
        </PageTransition>
      </body>
    </html>
  )
}
