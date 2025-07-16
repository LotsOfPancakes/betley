// app/layout.tsx - Production-ready with error boundaries
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from './providers'
import { NotificationToast } from './components/ui/NotificationToast'
import { Navigation } from '../components/Navigation'
import { CriticalErrorBoundary } from '@/components/ErrorBoundary'
import { Footer } from '../components/Footer'  // Add this line

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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