import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'PulseChat | Real-Time Messaging Architecture',
    template: '%s | PulseChat',
  },
  description:
    'Production-ready real-time chat application featuring optimistic updates, threshold scroll lock, offline mutation queue, and interactive network simulator.',
  keywords: [
    'Real-Time Chat',
    'Next.js 15',
    'WebSockets',
    'Socket.io',
    'React 19',
    'TypeScript',
    'Tailwind CSS',
    'Zustand',
    'TanStack Query',
  ],
  authors: [{ name: 'Senior Frontend Engineer Candidate' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pulsechat-demo.vercel.app',
    title: 'PulseChat | Real-Time Messaging Architecture',
    description:
      'High-performance real-time messaging architecture featuring sub-50ms latency, threshold auto-scroll, and resilient offline sync.',
    siteName: 'PulseChat',
    images: [
      {
        url: 'https://pulsechat-demo.vercel.app/og.png',
        width: 1200,
        height: 630,
        alt: 'PulseChat Architecture Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PulseChat Architecture Showcase',
    description: 'Enterprise real-time chat built with Next.js 15 and React 19.',
  },
  robots: {
    index: true,
    follow: true,
  },
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
    'Enterprise real-time chat application built with Next.js 15, WebSockets, optimistic UI updates, and offline sync.',
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
