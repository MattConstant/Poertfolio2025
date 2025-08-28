import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import GoogleAnalytics from '@/components/GoogleAnalytics'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Matthieu Constant',
  description: 'Professional portfolio showcasing my work and skills',
  keywords: ['portfolio', 'developer', 'web development', 'software engineer'],
  authors: [{ name: 'Matthieu Constant' }],
  creator: 'Matthieu Constant',
  openGraph: {
    title: 'Portfolio Matthieu Constant',
    description: 'Professional portfolio showcasing my work and skills',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  )
}
