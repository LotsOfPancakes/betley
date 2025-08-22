# Betley Design System Documentation

## Brand Overview
Betley is a decentralized betting platform with a modern, tech-forward aesthetic. The design emphasizes trustworthiness, excitement, and simplicity with a dark theme and vibrant green accent colors.

## Color Palette

### Brand Colors (Primary)
- **Primary Green**: `#22c55e` (Tailwind: `green-500`)
- **Secondary Emerald**: `#10b981` (Tailwind: `emerald-500`) 
- **Accent Lime**: `#84cc16` (Tailwind: `lime-500`)

### Background Colors
- **Primary Background**: `#030712` (Tailwind: `gray-950`)
- **Card Background**: `rgba(31, 41, 55, 0.65)` (Tailwind: `gray-800/65`)
- **Card Hover**: `rgba(31, 41, 55, 0.8)` (Tailwind: `gray-800/80`)
- **Navigation**: `rgba(3, 7, 18, 0.8)` (Tailwind: `gray-950/80`)

### Text Colors
- **Primary Text**: `#ffffff` (Tailwind: `white`)
- **Secondary Text**: `#d1d5db` (Tailwind: `gray-300`)
- **Muted Text**: `#9ca3af` (Tailwind: `gray-400`)
- **Placeholder Text**: `#9ca3af` (Tailwind: `gray-400`)

### Border Colors
- **Card Border**: `rgba(34, 197, 94, 0.2)` (Tailwind: `green-500/20`)
- **Card Border Hover**: `rgba(34, 197, 94, 0.4)` (Tailwind: `green-400/40`)

### Gradients
- **Brand Text Gradient**: `from-green-400 via-emerald-400 to-lime-400`
- **Button Gradient**: `from-green-500 to-emerald-500`
- **Button Hover Gradient**: `from-green-400 to-emerald-400`
- **Card Gradient**: `from-gray-900/80 to-gray-800/80`
- **Number Badge Gradient**: `from-green-500 to-emerald-500`

### Status Colors
- **Error/Warning**: `#ef4444` (Tailwind: `red-500`)
- **Success**: Uses brand green
- **Info**: Uses brand emerald

## Typography

### Font Family
- **Primary Font**: System default sans-serif stack
  - CSS: `var(--font-sans), Arial, Helvetica, sans-serif`
  - Web-safe fallback: Arial, Helvetica, sans-serif
- **Monospace Font**: `var(--font-mono)` (for code/addresses)

### Font Sizes & Hierarchy
- **Hero Text**: `text-4xl sm:text-5xl md:text-6xl` (48px - 96px)
- **Section Headers**: `text-2xl sm:text-3xl` (24px - 48px)
- **Card Headers**: `text-xl` (20px)
- **Body Text**: `text-base` (16px)
- **Small Text**: `text-sm` (14px)
- **Micro Text**: `text-xs` (12px)

### Font Weights
- **Bold**: Used for headers and brand name (`font-bold`)
- **Medium**: Used for emphasis (`font-medium`)
- **Normal**: Default body text (`font-normal`)

### Text Treatments
- **Brand Text**: Gradient background-clip text effect
- **Antialiasing**: `antialiased` class applied globally

## Spacing & Layout

### Container Widths
- **Content Container**: `max-w-7xl` (1280px)
- **Form Container**: `max-w-2xl` (672px)
- **CTA Container**: `max-w-4xl` (896px)

### Section Spacing
- **Standard Section**: `py-14` (56px vertical)
- **Hero Section**: `py-20` (80px vertical)

### Grid System
- **Background Grid Size**: `40px x 40px`
- **Responsive Breakpoints**: Follows Tailwind defaults
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px

## Border Radius
- **Cards**: `rounded-3xl` (24px)
- **Inputs**: `rounded-2xl` (16px)
- **Buttons**: `rounded-xl` (12px)
- **Badges**: `rounded-2xl` (16px)

## Shadows & Effects

### Glow Effects
- **Green Glow**: `0 0 30px rgba(34, 197, 94, 0.3), 0 0 60px rgba(34, 197, 94, 0.2), 0 0 100px rgba(34, 197, 94, 0.1)`
- **Button Shadow**: `shadow-lg shadow-green-500/25`

### Backdrop Effects
- **Navigation**: `backdrop-blur-sm`
- **Cards**: Subtle transparency with dark backgrounds

## Animations & Transitions

### Standard Transitions
- **Default**: `transition-all duration-300`
- **Slow**: `transition-all duration-500`

### Hover Effects
- **Scale**: `hover:scale-105`
- **Small Scale**: `group-hover:scale-110`
- **Color Transitions**: All interactive elements use smooth color transitions

### Loading States
- **Pulse**: `animate-pulse`
- **Pulse Delayed**: `animate-pulse delay-1000`
- **Spin**: `animate-spin`

## Component Patterns

### Buttons
- **Primary**: Green gradient background with hover effects
- **Secondary**: Transparent with green border
- **Disabled**: Reduced opacity with cursor disabled

### Cards
- **Background**: Semi-transparent gray with green borders
- **Hover**: Increased opacity and border brightness
- **Structure**: Rounded corners with consistent padding

### Form Elements
- **Inputs**: Dark background with green focus states
- **Labels**: Gray-300 color with proper spacing
- **Placeholders**: Gray-400 color

### Navigation
- **Active States**: Green text with gradient underline
- **Hover States**: Green color transition
- **Mobile**: Collapsible hamburger menu

## Brand Assets

### Logo
- **Primary Logo**: `/images/betley-logo-128.png`
- **Large Logo**: `/betley-logo-512.png`
- **Usage**: Always with glow effect and rounded background

### Favicons
- **16x16**: `/favicon-16x16.png`
- **32x32**: `/favicon-32x32.png`
- **Apple Touch Icon**: `/apple-touch-icon-180x180.png`

### Theme Colors (Meta Tags)
- **Light Mode**: `#ffffff`
- **Dark Mode**: `#111827`
- **Brand Theme**: `#22c55e`

## Accessibility

### Contrast Ratios
- White text on gray-950 background meets WCAG AA standards
- Green accents provide sufficient contrast for interactive elements
- Secondary gray-300 text maintains readability

### Focus States
- All interactive elements have visible focus indicators
- Keyboard navigation supported throughout
- Screen reader friendly markup

## Technical Implementation

### CSS Variables
```css
:root {
  --background: #0a0a0a;
  --foreground: #ededed;
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### Design System Constants
All design tokens are centralized in `/src/lib/constants/ui.ts` for consistency and maintainability.

### Responsive Design
- Mobile-first approach
- Fluid typography and spacing
- Optimized for all device sizes

## Usage Guidelines

### Do's
- Use the centralized design constants from ui.ts
- Maintain consistent spacing and typography hierarchy
- Apply brand colors consistently across all interfaces
- Use gradients for brand elements and CTAs

### Don'ts
- Avoid hardcoding design values outside the design system
- Don't use colors outside the approved palette
- Avoid mixing different border radius values
- Don't override the established typography scale

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Android Chrome)
- Progressive enhancement for older browsers