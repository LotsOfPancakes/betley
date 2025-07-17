'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectKitButton } from 'connectkit'

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-green-500/20 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent hover:from-green-300 hover:to-emerald-300 transition-all duration-300">
              Betley
            </Link>
            <div className="hidden md:flex gap-6">
              <Link 
                href="/bets" 
                className={`text-gray-300 hover:text-green-400 transition-colors relative ${
                  pathname === '/bets' ? 'text-green-400' : ''
                }`}
              >
                My Bets
                {pathname === '/bets' && (
                  <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" />
                )}
              </Link>
              <Link 
                href="/setup" 
                className={`text-gray-300 hover:text-green-400 transition-colors relative ${
                  pathname === '/setup' ? 'text-green-400' : ''
                }`}
              >
                Create Bet
                {pathname === '/setup' && (
                  <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" />
                )}
              </Link>
            </div>
          </div>
          <div className="transform hover:scale-105 transition-transform">
            <ConnectKitButton />
          </div>
        </div>
      </div>
    </nav>
  )
}