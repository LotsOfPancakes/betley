interface FeatureCardProps {
  number?: string
  title: string
  description: string
  isNumbered?: boolean
}

export default function FeatureCard({ 
  number, 
  title, 
  description, 
  isNumbered = false 
}: FeatureCardProps) {
  return (
    <div className="group">
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-3xl p-8 hover:border-green-400/40 transition-all duration-500 hover:transform hover:scale-105 h-full">
        {isNumbered && number && (
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <span className="text-2xl font-bold text-black">{number}</span>
          </div>
        )}
        
        <h3 className={`font-semibold text-white mb-4 ${isNumbered ? 'text-xl' : 'text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-3'}`}>
          {title}
        </h3>
        
        <p className="text-gray-300 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}