'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectKitButton } from 'connectkit'

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">
              Betley
            </Link>
            <div className="hidden md:flex gap-6">
              <Link 
                href="/bets" 
                className={`text-gray-300 hover:text-white transition-colors ${pathname === '/bets' ? 'text-white' : ''}`}
              >
                My Bets
              </Link>
              <Link 
                href="/setup" 
                className={`text-gray-300 hover:text-white transition-colors ${pathname === '/setup' ? 'text-white' : ''}`}
              >
                Create Bet
              </Link>
            </div>
          </div>
          <ConnectKitButton />
        </div>
      </div>
    </nav>
  )
}