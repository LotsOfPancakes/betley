'use client'

// AppKit buttons are web components - no import needed

export function Navigation() {
  return (
    <nav className="bg-gray-950/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center h-12">
          {/* Wallet Button Only */}
          <div className="transform hover:scale-105 transition-transform">
            <appkit-button />
          </div>
        </div>
      </div>
    </nav>
  )
}