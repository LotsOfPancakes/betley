import FeatureCard from '../FeatureCard'
import { COLORS, DIMENSIONS } from '@/lib/constants/ui'

const steps = [
  {
    number: '1',
    title: 'Create a Bet',
    description: 'Define your terms & duration.\n\n Anyone can create a bet on any topic.' 
  },
  {
    number: '2', 
    title: 'Place Bets',
    description: 'Bet with ETH on your preferred outcome.\n\nBetley\'s contracts ensure all funds are held securely until resolution.'
  },
  {
    number: '3',
    title: 'Resolve, Win & Claim', 
    description: 'Creators resolve a Bet and Winners share the losing pool proportionally to their stake.'
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