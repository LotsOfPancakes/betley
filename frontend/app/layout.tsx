// frontend/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from './providers'
import { NotificationToast } from './components/ui/NotificationToast'
import { Navigation } from '../components/Navigation'

export const metadata: Metadata = {
  title: "Betley - Decentralized Betting",
  description: "Pari-mutuel betting platform on HyperEVM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <Navigation />
          {children}
          {/* Toast notifications - positioned globally */}
          <NotificationToast />
        </Providers>
      </body>
    </html>
  );
}