// frontend/lib/betIdMapping.ts - Updated to use database instead of localStorage
'use client'

export interface BetMapping {
  randomId: string
  numericId: number
  name: string
  creator: string
  createdAt: number
}

export class UnifiedBetMapper {
  /**
   * Create new mapping for a bet
   */
  static async createMapping(numericId: number, name: string, creator: string): Promise<string> {
    try {
      const response = await fetch('/api/bets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          numericId, 
          creatorAddress: creator, 
          betName: name 
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create mapping: ${response.status}`)
      }
      
      const { randomId } = await response.json()
      return randomId
    } catch (error) {
      console.error('Error creating bet mapping:', error)
      throw error
    }
  }

  /**
   * Get numeric ID from random ID
   */
  static async getNumericId(randomId: string): Promise<number | null> {
    try {
      const response = await fetch(`/api/bets/${randomId}`)
      
      if (!response.ok) {
        return null
      }
      
      const { numericId } = await response.json()
      return numericId
    } catch (error) {
      console.error('Error fetching bet mapping:', error)
      return null
    }
  }

  /**
   * Check if random ID exists
   */
  static async isValidRandomId(randomId: string): Promise<boolean> {
    const numericId = await this.getNumericId(randomId)
    return numericId !== null
  }

  // Keep these legacy methods for backward compatibility during transition
  /**
   * @deprecated Use async methods instead
   */
  static getAllMappings(): BetMapping[] {
    console.warn('getAllMappings is deprecated - use database methods')
    return []
  }

  /**
   * @deprecated Use async methods instead  
   */
  static getRandomId(_numericId: number): string | undefined {
    console.warn('getRandomId is deprecated - mappings are now one-way only')
    return undefined
  }

  /**
   * @deprecated Use async methods instead
   */
  static getMapping(_randomId: string): BetMapping | null {
    console.warn('getMapping is deprecated - use database methods')
    return null
  }

  /**
   * @deprecated No longer needed with database
   */
  static clearAllMappings(): void {
    console.warn('clearAllMappings is deprecated - mappings are in database')
  }
}

// Export convenient alias
export const BetIdMapper = UnifiedBetMapper