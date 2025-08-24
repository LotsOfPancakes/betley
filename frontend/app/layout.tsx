// frontend/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { headers } from 'next/headers'
import "./globals.css";
import ContextProvider from '@/context'
import { NotificationToast } from './components/ui/NotificationToast'
import { Navigation } from '@/components/Navigation'
import { CriticalErrorBoundary } from '@/components/ErrorBoundary'
import { Footer } from '@/components/Footer'
import { config, appConfig } from '@/lib/config'

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
  metadataBase: new URL(appConfig.url),
  title: "Betley - Bet Anything",
  description: "Easiest way to set up an on-chain bet on anything",
  
  // ✅ ENHANCED: Open Graph for rich previews in chat apps
  openGraph: {
    title: "Betley - Bet Anything",
    description: "Easiest way to set up an on-chain bet on anything", 
    type: "website",
    url: appConfig.url, 
    siteName: "Betley",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Betley - Decentralized Betting Platform",
      },
      {
        url: "/betley-logo-512.png", // Square logo for some platforms
        width: 512,
        height: 512,
        alt: "Betley Logo",
      }
    ],
    locale: 'en_US',
  },

  // ✅ ENHANCED: Twitter/X specific metadata
  twitter: {
    card: "summary_large_image",
    title: "Betley - Bet Anything",
    description: "Easiest way to set up an on-chain bet on anything",
    images: ["/og-image.png"], // Same image as OG
    creator: "@betleyxyz", // creator Twitter handle
    site: "@betleyxyz", // app's Twitter handle
  },

  // ✅ ENHANCED: Additional metadata for better SEO
  keywords: [
    "betting",
    "decentralized",
    "blockchain", 
    "Base",
    "ETH",
    "pari-mutuel",
    "crypto betting",
    "web3"
  ],
  
  // ✅ ENHANCED: App-specific metadata  
  applicationName: "Betley",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  creator: "Betley Team",
  publisher: "Betley",
  
  // ✅ ENHANCED: Icons for different platforms
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
    apple: [
      { url: "/apple-touch-icon-180x180.png", sizes: "180x180" },
    ],
  },

  // ✅ ENHANCED: Manifest for PWA features
  manifest: "/site.webmanifest",

  // ✅ ENHANCED: Mobile app metadata
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Betley',
  },

  // ✅ ENHANCED: Additional meta for some platforms
  other: {
    "msapplication-TileColor": "#22c55e",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#111827"
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersData = await headers()
  const cookies = headersData.get('cookie')

  return (
    <html lang="en">
      <head>
        {/* ✅ ENHANCED: Additional meta tags for chat app previews */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        

        
        {/* ✅ ENHANCED: Discord-specific meta tags */}
        <meta property="discord:color" content="#22c55e" />
        
        {/* ✅ ENHANCED: Dynamic preconnect based on network configuration */}
        <link rel="preconnect" href={new URL(config.network.rpcUrls[0]).origin} />
        <link rel="dns-prefetch" href={new URL(config.network.rpcUrls[0]).origin} />
        
        {/* ✅ ENHANCED: Structured data for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Betley",
              "description": "Easiest way to set up an on-chain bet on anything",
              "url": appConfig.url,
              "applicationCategory": "GameApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "screenshot": `${appConfig.url}/og-image.png`
            })
          }}
        />
      </head>
      <body className="antialiased">
        <CriticalErrorBoundary>
          <ContextProvider cookies={cookies}>
            <Navigation />
            {children}
            <Footer />
            <NotificationToast />
          </ContextProvider>
        </CriticalErrorBoundary>
      </body>
    </html>
  );
}