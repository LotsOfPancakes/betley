'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import BackgroundElements from './components/BackgroundElements'
import HeroSection from './components/sections/HeroSection'
// import HowItWorksSection from './components/sections/HowItWorksSection'
// import KeyFeaturesSection from './components/sections/KeyFeaturesSection' //stop using keyFeatures section for now
// import CTASection from './components/sections/CTASection' // stop using CTA bottom section for now
import { COLORS } from '@/lib/constants/ui'

export default function HomePage() {
  const router = useRouter()
  const { address } = useAccount()
  const [betTitle, setBetTitle] = useState('')
  const [isNavigating, setIsNavigating] = useState(false)

  const handleCreateBet = async () => {
    if (!betTitle.trim() || isNavigating) return
    
    setIsNavigating(true)
    
    try {
      const encodedTitle = encodeURIComponent(betTitle.trim())
      await router.push(`/setup?title=${encodedTitle}`)
    } catch (error) {
      console.error('Navigation failed:', error)
      setIsNavigating(false)
    }
  }

  return (
    <div className={`min-h-screen ${COLORS.backgrounds.primary} ${COLORS.text.primary} relative overflow-hidden`}>
      <BackgroundElements />
      
      <div className="relative z-20">
        <HeroSection
          betTitle={betTitle}
          setBetTitle={setBetTitle}
          handleCreateBet={handleCreateBet}
          isConnected={!!address}
          isNavigating={isNavigating}
        />
        
        {/* <HowItWorksSection /> */}
                
        {/* <CTASection
          betTitle={betTitle}
          setBetTitle={setBetTitle}
          handleCreateBet={handleCreateBet}
          isConnected={!!address}
          isNavigating={isNavigating}
        /> */}
      </div>
    </div>
  )
}