// app/layout.tsx - Mobile-optimized with viewport meta
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from './providers'
import { NotificationToast } from './components/ui/NotificationToast'
import { Navigation } from '../components/Navigation'
import { CriticalErrorBoundary } from '@/components/ErrorBoundary'
import { Footer } from '../components/Footer'

// ✅ CRITICAL: Add viewport configuration for mobile
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' }
  ]
}

export const metadata: Metadata = {
  title: "Betley - Bet Anything",
  description: "Decentralized, impromptu betting platform on HyperEVM",
  openGraph: {
    title: "Betley - Bet Anything",
    description: "Decentralized, impromptu betting platform on HyperEVM", 
    type: "website",
    url: "https://betley.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Betley - Bet Anything",
    description: "Decentralized, impromptu betting platform on HyperEVM",
  },
  // ✅ Add mobile-specific meta tags
  formatDetection: {
    telephone: false, // Prevent auto-linking phone numbers
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Betley'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Additional mobile optimizations */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* ✅ Prevent text size adjustment on mobile */}
        <meta name="format-detection" content="telephone=no" />
        
        {/* ✅ Preconnect to improve performance */}
        <link rel="preconnect" href="https://rpc.hyperliquid-testnet.xyz" />
      </head>
      <body className="antialiased">
        <CriticalErrorBoundary>
          <Providers>
            <Navigation />
            {children}
            <Footer />
            {/* Toast notifications - positioned globally */}
            <NotificationToast />
          </Providers>
        </CriticalErrorBoundary>
      </body>
    </html>
  );
}