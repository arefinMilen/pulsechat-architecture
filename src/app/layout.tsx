import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { siteUrl } from '@/lib/site';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'PulseChat — real-time messaging',
    template: '%s | PulseChat',
  },
  description:
    'A chat application with live message delivery, optimistic sending, considerate auto-scroll, and honest loading, empty, and error states.',
  keywords: [
    'real-time chat',
    'Next.js 15',
    'React 19',
    'Socket.IO',
    'TypeScript',
    'Tailwind CSS',
    'Zustand',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    title: 'PulseChat — real-time messaging',
    description:
      'Live message delivery, optimistic sending, and scroll that stays where you put it.',
    siteName: 'PulseChat',
    images: [{ url: '/og', width: 1200, height: 630, alt: 'PulseChat' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PulseChat — real-time messaging',
    description:
      'Live message delivery, optimistic sending, and scroll that stays where you put it.',
    images: ['/og'],
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PulseChat',
  operatingSystem: 'Any',
  applicationCategory: 'CommunicationApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description:
    'A real-time chat application built with Next.js 15, React 19, and Socket.IO.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#090d16] text-gray-100 antialiased selection:bg-indigo-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
