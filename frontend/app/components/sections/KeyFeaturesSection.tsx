import FeatureCard from '../FeatureCard'
import { COLORS, DIMENSIONS } from '@/lib/constants/ui'

const features = [
  {
    title: 'Trustless',
    description: 'No intermediaries needed'
  },
  {
    title: 'Flexible',
    description: 'Custom options & bet duration'
  },
  {
    title: 'Pari-mutuel',
    description: 'Fair payout system'
  }
]

export default function KeyFeaturesSection() {
  return (
    <div className={DIMENSIONS.spacing.section}>
      <div className={`${DIMENSIONS.maxWidth.content} mx-auto px-4 sm:px-6 lg:px-8`}>
        <h2 className="text-4xl font-bold text-center mb-12">
          <span className={COLORS.gradients.brandText}>
            Key Features
          </span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              isNumbered={false}
            />
          ))}
        </div>
      </div>
    </div>
  )
}