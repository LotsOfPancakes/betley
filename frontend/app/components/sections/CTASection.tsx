import BetTitleInput from '../BetTitleInput'
import { COLORS, DIMENSIONS } from '@/lib/constants/ui'

interface CTASectionProps {
  betTitle: string
  setBetTitle: (title: string) => void
  handleCreateBet: () => void
  isConnected: boolean
  isNavigating: boolean
}

export default function CTASection({
  betTitle,
  setBetTitle,
  handleCreateBet,
  isConnected,
  isNavigating
}: CTASectionProps) {
  return (
    <div className={DIMENSIONS.spacing.section}>
      <div className={`${DIMENSIONS.maxWidth.cta} mx-auto px-4`}>
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-6">
            <span className={COLORS.gradients.brandText}>
              Got a Bet in mind?
            </span>
          </h2>
          
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