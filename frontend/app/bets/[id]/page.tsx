// frontend/app/bets/[id]/page.tsx 

import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import BetPageClient from './BetPageClient'

// Simple generateMetadata function with static Yes/No
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  try {
    // Await the params in Next.js 15
    const { id: randomId } = await params
    
    // Look up bet details from database (no options needed)
    const { data: mapping } = await supabase
      .from('bet_mappings')
      .select('bet_name, numeric_id')
      .eq('random_id', randomId)
      .single()

    if (!mapping) {
      // Fallback for invalid bet IDs
      return {
        title: 'Bet Not Found - Betley',
        description: 'This bet could not be found.',
        openGraph: {
          title: 'Bet Not Found - Betley',
          description: 'This bet could not be found.',
          images: ['/og-image.png'],
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Bet Not Found - Betley',
          description: 'This bet could not be found.',
          images: ['/og-image.png'],
        }
      }
    }

    const betTitle = mapping.bet_name
    const betUrl = `https://www.betley.xyz/bets/${randomId}`
    
    // Static description with Yes or No
    const description = `Betley | Join this Bet. What do you think - Yes or No?`
    
    // Create dynamic metadata with bet title
    return {
      title: betTitle,
      description: description,
      
      openGraph: {
        title: betTitle,
        description: description,
        type: 'website',
        url: betUrl,
        siteName: 'Betley',
        images: [
          {
            url: '/og-bet-image.png',
            width: 1200,
            height: 630,
            alt: `Bet: ${betTitle}`,
          }
        ],
      },
      
      twitter: {
        card: 'summary_large_image',
        title: betTitle,
        description: description,
        images: ['/og-bet-image.png'],
        creator: '@betleyxyz',
        site: '@betleyxyz',
      },
      
      // Additional metadata
      alternates: {
        canonical: betUrl
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    
    // Fallback metadata on error
    return {
      title: 'Bet - Betley',
      description: 'Join this bet on Betley, the easiest way to set up on-chain bets.',
      openGraph: {
        title: 'Bet - Betley',
        description: 'Join this bet on Betley.',
        images: ['/og-image.png'],
      }
    }
  }
}

// Server component that renders the client component
export default async function BetPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  
  // Pass the ID to the client component
  return <BetPageClient id={id} />
}