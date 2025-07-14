// frontend/lib/betIdMapping.ts - UNIFIED SYSTEM (replaces all others)
'use client'

export interface BetMapping {
  randomId: string
  numericId: number
  name: string
  creator: string
  createdAt: number
}

interface BetDetailsFromContract {
  name: string
  creator: string
  [key: string]: unknown
}

export class UnifiedBetMapper {
  private static STORAGE_KEY = 'betley_unified_mappings'

  /**
   * Generate collision-resistant random ID
   */
  static generateRandomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Get all mappings from storage
   */
  static getAllMappings(): BetMapping[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading bet mappings:', error)
      return []
    }
  }

  /**
   * Save mappings to storage
   */
  private static saveMappings(mappings: BetMapping[]): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mappings))
    } catch (error) {
      console.error('Error saving bet mappings:', error)
    }
  }

  /**
   * Create new mapping for a bet
   */
  static createMapping(numericId: number, name: string, creator: string): string {
    const mappings = this.getAllMappings()
    
    // Check if mapping already exists for this numeric ID
    const existingMapping = mappings.find(m => m.numericId === numericId)
    if (existingMapping) {
      return existingMapping.randomId
    }

    // Generate unique random ID
    let randomId: string
    let attempts = 0
    do {
      randomId = this.generateRandomId()
      attempts++
      if (attempts > 100) {
        throw new Error('Unable to generate unique bet ID after 100 attempts')
      }
    } while (mappings.some(m => m.randomId === randomId))

    // Create new mapping
    const newMapping: BetMapping = {
      randomId,
      numericId,
      name,
      creator,
      createdAt: Date.now()
    }

    mappings.push(newMapping)
    this.saveMappings(mappings)
    
    console.log('📝 Created bet mapping:', { randomId, numericId, name })
    return randomId
  }

  /**
   * Get numeric ID from random ID
   */
  static getNumericId(randomId: string): number | null {
    const mappings = this.getAllMappings()
    const mapping = mappings.find(m => m.randomId === randomId)
    return mapping ? mapping.numericId : null
  }

  /**
   * Get random ID from numeric ID
   */
  static getRandomId(numericId: number): string | undefined {
    const mappings = this.getAllMappings()
    const mapping = mappings.find(m => m.numericId === numericId)
    return mapping ? mapping.randomId : undefined  // Return undefined instead of null
  }

  /**
   * Get full mapping details
   */
  static getMapping(randomId: string): BetMapping | null {
    const mappings = this.getAllMappings()
    return mappings.find(m => m.randomId === randomId) || null
  }

  /**
   * Check if random ID exists
   */
  static isValidRandomId(randomId: string): boolean {
    return this.getNumericId(randomId) !== null
  }

  /**
   * Auto-discover and create mappings for existing bets (useful for recovery)
   */
  static async discoverMissingMappings(
    betCounter: number, 
    getBetDetails: (id: number) => Promise<BetDetailsFromContract | null>
  ): Promise<number> {
    const mappings = this.getAllMappings()
    const existingNumericIds = mappings.map(m => m.numericId)
    let discovered = 0

    for (let i = 0; i < betCounter; i++) {
      if (!existingNumericIds.includes(i)) {
        try {
          const details = await getBetDetails(i)
          if (details && details.name && details.creator) {
            this.createMapping(i, details.name, details.creator as string)
            discovered++
          }
        } catch (error) {
          console.error(`Error discovering bet ${i}:`, error)
        }
      }
    }

    if (discovered > 0) {
      console.log(`🔍 Auto-discovered ${discovered} missing bet mappings`)
    }

    return discovered
  }

  /**
   * Clear all mappings (for fresh start)
   */
  static clearAllMappings(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY)
      console.log('🗑️ Cleared all bet mappings')
    }
  }

  /**
   * Get storage statistics
   */
  static getStats(): { totalMappings: number; oldestMapping: number | null; newestMapping: number | null } {
    const mappings = this.getAllMappings()
    
    if (mappings.length === 0) {
      return { totalMappings: 0, oldestMapping: null, newestMapping: null }
    }

    const timestamps = mappings.map(m => m.createdAt)
    return {
      totalMappings: mappings.length,
      oldestMapping: Math.min(...timestamps),
      newestMapping: Math.max(...timestamps)
    }
  }
}

// Export convenient aliases
export const BetIdMapper = UnifiedBetMapper