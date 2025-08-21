import BetTitleInput from '../BetTitleInput'
import { COLORS, DIMENSIONS } from '@/lib/constants/ui'

interface HeroSectionProps {
  betTitle: string
  setBetTitle: (title: string) => void
  handleCreateBet: () => void
  isConnected: boolean
  isNavigating: boolean
}

export default function HeroSection({
  betTitle,
  setBetTitle,
  handleCreateBet,
  isConnected,
  isNavigating
}: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden">
      <div className={`${DIMENSIONS.maxWidth.content} mx-auto px-4 sm:px-6 lg:px-8 ${DIMENSIONS.spacing.hero}`}>
        <div className="text-center">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            <span className={COLORS.gradients.brandText}>
              Bet on
            </span>
            <br/>
            <span className={COLORS.text.primary}> Anything</span>
          </h1>
          
          <BetTitleInput
            value={betTitle}
            onChange={setBetTitle}
            onSubmit={handleCreateBet}
            isConnected={isConnected}
            isLoading={isNavigating}
          />
        </div>
      </div>
    </div>
  )
}