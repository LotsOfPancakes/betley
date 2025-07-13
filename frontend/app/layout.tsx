// app/layout.tsx - Production-ready with error boundaries
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from './providers'
import { NotificationToast } from './components/ui/NotificationToast'
import { Navigation } from '../components/Navigation'
import { CriticalErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: "Betley - Decentralized Betting",
  description: "Pari-mutuel betting platform on HyperEVM",
  openGraph: {
    title: "Betley - Decentralized Betting",
    description: "Pari-mutuel betting platform on HyperEVM", 
    type: "website",
    url: "https://betley.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Betley - Decentralized Betting",
    description: "Pari-mutuel betting platform on HyperEVM",
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
            {/* Toast notifications - positioned globally */}
            <NotificationToast />
          </Providers>
        </CriticalErrorBoundary>
      </body>
    </html>
  );
}