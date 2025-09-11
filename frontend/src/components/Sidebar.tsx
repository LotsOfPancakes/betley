'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const [showTelegramTooltip, setShowTelegramTooltip] = useState(false)

  return (
    <div className="fixed left-0 top-0 h-full w-54 bg-transparent backdrop-blur-sm border-r border-green-500/20 z-40 hidden md:flex flex-col">
      {/* Logo Section */}
      <div className="p-6">
        <Link 
          href="/" 
          className="flex items-center gap-2 group"
        >
          {/* Logo Image */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <div className="absolute inset-1 bg-gradient-to-br from-green-400/10 to-emerald-200/10 rounded-xl blur-sm transition-all duration-300" />
            <div className="relative w-full h-full rounded-xl transition-all duration-300 p-1">
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
          <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent group-hover:from-green-300 group-hover:to-emerald-300 transition-all duration-300">
            Betley
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-6">
        <div className="space-y-2">          
          <Link 
            href="/bets" 
            className={`flex items-center px-3 py-3 text-gray-300 hover:text-green-400 hover:bg-green-400/5 rounded-lg transition-colors relative group ${
              pathname === '/bets' ? 'text-green-400 bg-green-400/10' : ''
            }`}
          >
            <span className="font-medium">All Bets</span>
            {pathname === '/bets' && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-400 rounded-r" />
            )}
          </Link>

          <Link 
            href="/setup" 
            className={`flex items-center px-3 py-3 text-gray-300 hover:text-green-400 hover:bg-green-400/5 rounded-lg transition-colors relative group ${
              pathname === '/setup' ? 'text-green-400 bg-green-400/10' : ''
            }`}
          >
            <span className="font-medium">Create a Bet</span>
            {pathname === '/setup' && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-400 rounded-r" />
            )}
          </Link>

          <Link 
            href="/stats" 
            className={`flex items-center px-3 py-3 text-gray-300 hover:text-green-400 hover:bg-green-400/5 rounded-lg transition-colors relative group ${
              pathname === '/stats' ? 'text-green-400 bg-green-400/10' : ''
            }`}
          >
            <span className="font-medium">Stats</span>
            {pathname === '/stats' && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-400 rounded-r" />
            )}
          </Link>

          {/* Separator */}
          <div className="h-px bg-gray-700/50 my-4 mx-3"></div>

          {/* Telegram Bot Link */}
          <div className="relative">
            <a 
              href="https://t.me/BetleyBot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-3 text-gray-300 hover:text-green-400 hover:bg-green-400/5 rounded-lg transition-colors group"
              onMouseEnter={() => setShowTelegramTooltip(true)}
              onMouseLeave={() => setShowTelegramTooltip(false)}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span className="font-medium">Add Betley TG Bot</span>
              <span className="ml-2 inline-block w-3 h-3 rounded-full bg-gray-500/30 text-xs cursor-help hover:bg-gray-400/40 transition-colors text-center leading-3">
                i
              </span>
            </a>
            
            {/* Tooltip */}
            {showTelegramTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-800 border border-gray-600 rounded-lg shadow-xl text-sm text-gray-200 z-50">
                <div className="text-center">
                  Betley Bot on TG allows you to quickly and easily create bets in your groups
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Twitter Link */}
      <div className="p-6">
        <a 
          href="https://x.com/betleyxyz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800/60 text-gray-300 hover:text-green-400 hover:bg-green-400/5 transition-all duration-300 group border border-gray-700/50 hover:border-green-400/30"
          aria-label="Follow Betley on Twitter"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
      </div>
    </div>
  )
}

export function MobileSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [showTelegramTooltip, setShowTelegramTooltip] = useState(false)

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 text-gray-300 hover:text-white bg-gray-950/80 backdrop-blur-sm rounded-lg border border-green-500/20"
        aria-label="Toggle mobile menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed left-0 top-0 h-full w-54 bg-black/20 backdrop-blur-sm border-r border-green-500/20 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo Section */}
        <div className="p-6">
          <Link 
            href="/" 
            className="flex items-center gap-3 group"
            onClick={() => setIsOpen(false)}
          >
            {/* Logo Image */}
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-200/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
              <div className="relative w-full h-full rounded-xl transition-all duration-300 p-1">
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
            <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent group-hover:from-green-300 group-hover:to-emerald-300 transition-all duration-300">
              Betley
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-6">
          <div className="space-y-2">
            <Link 
              href="/" 
              onClick={() => setIsOpen(false)}
              className={`flex items-center px-3 py-3 text-gray-300 hover:text-green-400 hover:bg-green-400/5 rounded-lg transition-colors relative group ${
                pathname === '/' ? 'text-green-400 bg-green-400/10' : ''
              }`}
            >
              <span className="font-medium">Home</span>
              {pathname === '/' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-400 rounded-r" />
              )}
            </Link>
            
            <Link 
              href="/bets" 
              onClick={() => setIsOpen(false)}
              className={`flex items-center px-3 py-3 text-gray-300 hover:text-green-400 hover:bg-green-400/5 rounded-lg transition-colors relative group ${
                pathname === '/bets' ? 'text-green-400 bg-green-400/10' : ''
              }`}
            >
              <span className="font-medium">All Bets</span>
              {pathname === '/bets' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-400 rounded-r" />
              )}
            </Link>

            <Link 
              href="/setup" 
              onClick={() => setIsOpen(false)}
              className={`flex items-center px-3 py-3 text-gray-300 hover:text-green-400 hover:bg-green-400/5 rounded-lg transition-colors relative group ${
                pathname === '/setup' ? 'text-green-400 bg-green-400/10' : ''
              }`}
            >
              <span className="font-medium">Create Bets</span>
              {pathname === '/setup' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-400 rounded-r" />
              )}
            </Link>

            <Link 
              href="/stats" 
              onClick={() => setIsOpen(false)}
              className={`flex items-center px-3 py-3 text-gray-300 hover:text-green-400 hover:bg-green-400/5 rounded-lg transition-colors relative group ${
                pathname === '/stats' ? 'text-green-400 bg-green-400/10' : ''
              }`}
            >
              <span className="font-medium">Stats</span>
              {pathname === '/stats' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-400 rounded-r" />
              )}
            </Link>

            {/* Separator */}
            <div className="h-px bg-gray-700/50 my-4 mx-3"></div>

            {/* Telegram Bot Link */}
            <div className="relative">
              <a 
                href="https://t.me/BetleyBot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-3 text-gray-300 hover:text-green-400 hover:bg-green-400/5 rounded-lg transition-colors group"
                onMouseEnter={() => setShowTelegramTooltip(true)}
                onMouseLeave={() => setShowTelegramTooltip(false)}
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="font-medium">Add Betley TG Bot</span>
                <span className="ml-2 inline-block w-3 h-3 rounded-full bg-gray-500/30 text-xs cursor-help hover:bg-gray-400/40 transition-colors text-center leading-3">
                  i
                </span>
              </a>
              
              {/* Tooltip */}
              {showTelegramTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-800 border border-gray-600 rounded-lg shadow-xl text-sm text-gray-200 z-50">
                  <div className="text-center">
                    Betley Bot on TG allows you to quickly and easily create bets in your groups
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Twitter Link */}
        <div className="p-6">
          <a 
            href="https://x.com/betleyxyz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800/60 text-gray-300 hover:text-green-400 hover:bg-green-400/5 transition-all duration-300 group border border-gray-700/50 hover:border-green-400/30"
            aria-label="Follow Betley on Twitter"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </div>
      </div>
    </>
  )
}