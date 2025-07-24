'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ConnectKitButton } from 'connectkit'
import { useState } from 'react'

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="border-b border-green-500/20 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center gap-3 group"
            >
              {/* Logo Image */}
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-200/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
                <div className="relative w-full h-full rounded-xl transition-all duration-300 sm:p-1">
                  <Image 
                    src="/images/betley-logo-128.png" 
                    alt="Betley Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                    unoptimized={true}
                    priority
                  />
                </div>
              </div>
              
              {/* Logo Text */}
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent group-hover:from-green-300 group-hover:to-emerald-300 transition-all duration-300">
                Betley
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/bets" 
              className={`text-gray-300 hover:text-green-400 transition-colors relative ${
                pathname === '/bets' ? 'text-green-400' : ''
              }`}
            >
              All Bets
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
            <div className="transform hover:scale-105 transition-transform">
              <ConnectKitButton />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            <div className="transform hover:scale-105 transition-transform">
              <ConnectKitButton />
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-white p-2"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-green-500/20 py-4">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/bets" 
                onClick={() => setMobileMenuOpen(false)}
                className={`text-gray-300 hover:text-green-400 transition-colors px-2 py-1 ${
                  pathname === '/bets' ? 'text-green-400' : ''
                }`}
              >
                My Bets
              </Link>
              <Link 
                href="/setup" 
                onClick={() => setMobileMenuOpen(false)}
                className={`text-gray-300 hover:text-green-400 transition-colors px-2 py-1 ${
                  pathname === '/setup' ? 'text-green-400' : ''
                }`}
              >
                Create Bet
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}