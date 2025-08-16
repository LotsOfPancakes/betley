'use client'

import { useState, useRef, useEffect } from 'react'

interface CreatorDropdownProps {
  address?: string
  creator: string
  resolved: boolean
  onResolveEarly: () => void
  onManageWhitelist: () => void
}

export function CreatorDropdown({
  address,
  creator,
  resolved,
  onResolveEarly,
  onManageWhitelist
}: CreatorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const isCreator = address && creator && address.toLowerCase() === creator.toLowerCase()
  
  // Don't show if not creator or bet is resolved
  if (!isCreator || resolved) return null

  const handleResolveEarly = () => {
    setIsOpen(false)
    onResolveEarly()
  }

  const handleManageWhitelist = () => {
    setIsOpen(false)
    onManageWhitelist()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 shadow-lg"
        aria-label="Creator options"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-xl shadow-black/20 z-50">
          <div className="py-2">
            <button
              onClick={handleResolveEarly}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors duration-200 flex items-center gap-2"
            >
              <span>⚡</span>
              Resolve Early
            </button>
            <button
              onClick={handleManageWhitelist}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors duration-200 flex items-center gap-2"
            >
              <span>👥</span>
              Manage Whitelist
            </button>
          </div>
        </div>
      )}
    </div>
  )
}