'use client'

import { useState } from 'react'
import { COLORS, DIMENSIONS, ANIMATIONS } from '@/lib/constants/ui'

interface TimelineProps {
  endTime?: bigint
  createdAt?: string
  resolved: boolean
  isOpen?: boolean
  onToggle?: () => void
}

interface TimelineItemProps {
  title: string
  time: string
  status: 'completed' | 'active' | 'pending'
  isLast?: boolean
}

function TimelineItem({ title, time, status, isLast }: TimelineItemProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return {
          dot: 'bg-green-500',
          line: isLast ? 'hidden' : 'bg-green-500/30',
          text: 'text-green-400',
          time: 'text-gray-300'
        }
      case 'active':
        return {
          dot: 'bg-yellow-500 animate-pulse',
          line: isLast ? 'hidden' : 'bg-gray-600',
          text: 'text-yellow-400',
          time: 'text-gray-300'
        }
      case 'pending':
        return {
          dot: 'bg-gray-600',
          line: isLast ? 'hidden' : 'bg-gray-600',
          text: 'text-gray-400',
          time: 'text-gray-500'
        }
    }
  }

  const styles = getStatusStyles()

  return (
    <div className="flex items-start gap-4 relative">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${styles.dot} z-10`} />
        {!isLast && (
          <div className={`w-0.5 h-8 mt-2 ${styles.line}`} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <h4 className={`font-semibold ${styles.text}`}>{title}</h4>
        <p className={`text-sm ${styles.time} mt-1`}>{time}</p>
      </div>
    </div>
  )
}

export function Timeline({ endTime, createdAt, resolved, isOpen: controlledIsOpen, onToggle }: TimelineProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const handleToggle = onToggle || (() => setInternalIsOpen(!internalIsOpen))

  const formatTime = (timestamp: bigint | string | undefined): string => {
    if (!timestamp) return 'Unknown'
    
    try {
      let date: Date
      if (typeof timestamp === 'bigint') {
        // Unix timestamp from blockchain - multiply by 1000 for milliseconds
        date = new Date(Number(timestamp) * 1000)
      } else {
        // Database timestamp string - ensure it's treated as UTC
        const utcTimestamp = timestamp.includes('Z') || timestamp.includes('+') || timestamp.includes('T') 
          ? timestamp 
          : timestamp.replace(' ', 'T') + 'Z'
        date = new Date(utcTimestamp)
      }
      
      if (isNaN(date.getTime())) return 'Invalid date'
      
      // Get the timezone offset in minutes and convert to hours
      const timezoneOffset = date.getTimezoneOffset()
      const offsetHours = Math.abs(timezoneOffset / 60)
      const offsetSign = timezoneOffset <= 0 ? '+' : '-'
      
      // Format the timezone as GMT±X
      const timezone = `GMT${offsetSign}${offsetHours}`
      
      // Format the date and time
      const dateTimeString = date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      
      return `${dateTimeString} (${timezone})`
    } catch {
      return 'Invalid date'
    }
  }

  const getTimelineItems = (): TimelineItemProps[] => {
    const now = Date.now()
    const endTimeMs = endTime ? Number(endTime) * 1000 : 0
    const isMarketActive = now < endTimeMs
    const isMarketClosed = !isMarketActive && endTimeMs > 0

    return [
      {
        title: 'Bet Published',
        time: formatTime(createdAt),
        status: 'completed'
      },
      {
        title: 'Bet Closes',
        time: formatTime(endTime),
        status: isMarketActive ? 'active' : isMarketClosed ? 'completed' : 'pending'
      },
      {
        title: 'Resolution',
        time: resolved ? 'Completed' : 'Within 24 hours - or Refunds will be triggered',
        status: resolved ? 'completed' : isMarketClosed ? 'active' : 'pending',
        isLast: true
      }
    ]
  }

  const timelineItems = getTimelineItems()

  return (
    <div className={`${COLORS.gradients.card} backdrop-blur-sm ${COLORS.borders.card} ${DIMENSIONS.borderRadius.card} overflow-hidden ${ANIMATIONS.transition}`}>
      {/* Header with toggle */}
      <button
        onClick={handleToggle}
        className={`w-full px-6 py-4 flex items-center justify-between text-left ${COLORS.text.primary} hover:bg-white/5 ${ANIMATIONS.transition}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="font-semibold">Timeline</span>
        </div>
        
        {/* Caret */}
        <svg 
          className={`w-5 h-5 ${COLORS.text.secondary} ${ANIMATIONS.transition} ${isOpen ? 'rotate-270' : 'rotate-90'}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Timeline content */}
      {isOpen && (
        <div className="px-6 pb-6 border-t border-gray-700/50">
          <div className="pt-6">
            {timelineItems.map((item, index) => (
              <TimelineItem
                key={index}
                title={item.title}
                time={item.time}
                status={item.status}
                isLast={item.isLast}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}