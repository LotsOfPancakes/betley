import { DIMENSIONS, ANIMATIONS } from '@/lib/constants/ui'

export default function BackgroundElements() {
  return (
    <>
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-[0.2]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: `${DIMENSIONS.grid.backgroundSize} ${DIMENSIONS.grid.backgroundSize}`
          }}
        />
      </div>

      {/* Floating gradient orbs */}
      <div className={`absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-3xl ${ANIMATIONS.pulse}`} />
      <div className={`absolute bottom-40 left-32 w-96 h-96 bg-gradient-to-tr from-green-500/15 to-lime-400/15 rounded-full blur-3xl ${ANIMATIONS.pulse} ${ANIMATIONS.pulseDelay}`} />
    </>
  )
}