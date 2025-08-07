import FeatureCard from '../FeatureCard'
import { COLORS, DIMENSIONS } from '@/lib/constants/ui'

const steps = [
  {
    number: '1',
    title: 'Create a Bet',
    description: 'Define your bet terms & betting duration.\n\nAnyone can create a bet on any topic.'
  },
  {
    number: '2', 
    title: 'Place Bets',
    description: 'Bet with HYPE on your preferred outcome.\n\nBetley\'s contracts ensure all funds are held securely until resolution.'
  },
  {
    number: '3',
    title: 'Win & Claim', 
    description: 'Winners share the losing pool proportionally to their stake.'
  }
]

export default function HowItWorksSection() {
  return (
    <div className={DIMENSIONS.spacing.section}>
      <div className={`${DIMENSIONS.maxWidth.content} mx-auto px-4 sm:px-6 lg:px-8`}>
        <h2 className="text-4xl font-bold text-center mb-12">
          <span className={COLORS.gradients.brandText}>
            How It Works
          </span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <FeatureCard
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.description}
              isNumbered={true}
            />
          ))}
        </div>
      </div>
    </div>
  )
}