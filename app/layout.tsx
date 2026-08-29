import type { Metadata } from 'next'
import { Nunito_Sans, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppAppearanceShell } from '@/components/app-appearance-shell'
import './globals.css'

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito-sans',
  weight: 'variable',
  axes: ['opsz'],
})
const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono'
});

export const metadata: Metadata = {
  title: 'Rootsy — Recuperá el control de tu negocio',
  description:
    'Gestioná ventas, stock, compras y gastos desde un solo lugar. Rootsy se adapta a comercio, elaboración y gastronomía.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${nunitoSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <AppAppearanceShell>{children}</AppAppearanceShell>
        <Analytics />
      </body>
    </html>
  )
}
