// frontend/app/bets/[id]/page.tsx - SERVER COMPONENT (remove 'use client')

import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'
import BetPageClient from './BetPageClient'
  
// ADD THIS: Generate dynamic metadata function
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  try {
    // Await the params in Next.js 15
    const { id: randomId } = await params
    
    // Look up bet details from database using server client
    const supabase = createServerSupabaseClient()
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
    
    // Create dynamic metadata with bet title
    return {
      title: `${betTitle}`,
      description: `Betley | Join this Bet. Will you bet Yes or No?`,
      
      openGraph: {
        title: betTitle,
        description: `Betley | Join this Bet. Will you bet Yes or No?`,
        type: 'website',
        url: betUrl,
        siteName: 'Betley',
        images: [
          {
            url: '/og-bet-image.png', // You can create a specific image for bets
            width: 1200,
            height: 630,
            alt: `Bet: ${betTitle}`,
          }
        ],
      },
      
      twitter: {
        card: 'summary_large_image',
        title: betTitle,
        description: `Betley | Join this Bet. Will you bet Yes or No?`,
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
      title: 'Betley',
      description: 'Join this bet on Betley, the easiest way to set up on-chain bets.',
      openGraph: {
        title: 'Betley',
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