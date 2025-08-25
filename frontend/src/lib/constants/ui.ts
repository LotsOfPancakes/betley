export const COLORS = {
  brand: {
    green: '#22c55e',
    emerald: '#10b981',
    lime: '#84cc16',
  },
  gradients: {
    brandText: 'bg-gradient-to-r from-green-400 via-emerald-400 to-lime-400 bg-clip-text text-transparent',
    brandButton: 'bg-gradient-to-r from-green-500 to-emerald-500',
    brandButtonHover: 'hover:from-green-400 hover:to-emerald-400',
    card: 'bg-gradient-to-br from-gray-900/80 to-gray-800/80',
    numberBadge: 'bg-gradient-to-br from-green-500 to-emerald-500',
  },
  backgrounds: {
    primary: 'bg-gray-950',
    card: 'bg-gray-800/65',
    cardHover: 'bg-gray-800/80',
  },
  borders: {
    card: 'border-green-500/20',
    cardHover: 'hover:border-green-400/40',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-gray-300',
    muted: 'text-gray-400',
    placeholder: 'placeholder-gray-400',
    placeholderFocus: 'placeholder-gray-500',
  }
} as const

export const DIMENSIONS = {
  maxWidth: {
    content: 'max-w-7xl',
    form: 'max-w-2xl',
    cta: 'max-w-4xl',
  },
  spacing: {
    section: 'py-28',
    hero: 'py-28',
    cta: 'py-10',
  },
  borderRadius: {
    card: 'rounded-3xl',
    input: 'rounded-2xl',
    button: 'rounded-xl',
    badge: 'rounded-2xl',
  },
  grid: {
    backgroundSize: '40px 40px',
  }
} as const

export const ANIMATIONS = {
  transition: 'transition-all duration-300',
  transitionSlow: 'transition-all duration-500',
  hover: {
    scale: 'hover:transform hover:scale-105',
    scaleSmall: 'group-hover:scale-110 transition-transform',
  },
  pulse: 'animate-pulse',
  pulseDelay: 'animate-pulse delay-1000',
  spin: 'animate-spin',
} as const

export const SHADOWS = {
  glow: {
    green: '0 0 30px rgba(34, 197, 94, 0.3), 0 0 60px rgba(34, 197, 94, 0.2), 0 0 100px rgba(34, 197, 94, 0.1)',
    button: 'shadow-lg shadow-green-500/25',
  }
} as const