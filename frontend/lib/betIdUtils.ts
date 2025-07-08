// lib/betIdUtils.ts

/**
 * Generate a random URL-safe bet ID
 * Format: 8 characters, alphanumeric (no ambiguous characters)
 * Example: "a7x9m3k2", "p8q5n7r4"
 */
export function generateBetUrlId(): string {
  // Use characters that are easy to read and type (no 0, O, I, l, etc.)
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
  let result = ''
  
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

/**
 * Create a mapping between sequential bet IDs and random URL IDs
 * This will be stored in localStorage for now, but could be moved to a database
 */
export class BetIdMapper {
  private static STORAGE_KEY = 'betley_bet_id_mapping'
  
  // Get mapping from localStorage
  private static getMapping(): Record<string, number> {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }
  
  // Save mapping to localStorage
  private static saveMapping(mapping: Record<string, number>): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mapping))
    } catch {
      // Ignore storage errors
    }
  }
  
  // Get reverse mapping (sequential ID -> URL ID)
  private static getReverseMapping(): Record<number, string> {
    const mapping = this.getMapping()
    const reverse: Record<number, string> = {}
    
    for (const [urlId, sequentialId] of Object.entries(mapping)) {
      reverse[sequentialId] = urlId
    }
    
    return reverse
  }
  
  /**
   * Generate and store a new URL ID for a sequential bet ID
   */
  static createUrlId(sequentialBetId: number): string {
    const mapping = this.getMapping()
    const reverse = this.getReverseMapping()
    
    // Check if this sequential ID already has a URL ID
    if (reverse[sequentialBetId]) {
      return reverse[sequentialBetId]
    }
    
    // Generate a new URL ID that doesn't conflict
    let urlId: string
    let attempts = 0
    do {
      urlId = generateBetUrlId()
      attempts++
      // Prevent infinite loop
      if (attempts > 100) {
        throw new Error('Unable to generate unique bet ID')
      }
    } while (mapping[urlId] !== undefined)
    
    // Store the mapping
    mapping[urlId] = sequentialBetId
    this.saveMapping(mapping)
    
    return urlId
  }
  
  /**
   * Get sequential bet ID from URL ID
   */
  static getSequentialId(urlId: string): number | null {
    const mapping = this.getMapping()
    return mapping[urlId] ?? null
  }
  
  /**
   * Get URL ID from sequential bet ID
   */
  static getUrlId(sequentialBetId: number): string | null {
    const reverse = this.getReverseMapping()
    return reverse[sequentialBetId] ?? null
  }
  
  /**
   * Check if a URL ID exists
   */
  static isValidUrlId(urlId: string): boolean {
    return this.getSequentialId(urlId) !== null
  }
  
  /**
   * Bulk import mappings (useful for syncing existing bets)
   */
  static importMappings(sequentialIds: number[]): void {
    sequentialIds.forEach(id => {
      this.createUrlId(id)
    })
  }
}

/**
 * Hook for using bet ID mapping in React components
 */
export function useBetIdMapping() {
  const createUrlId = (sequentialId: number) => BetIdMapper.createUrlId(sequentialId)
  const getSequentialId = (urlId: string) => BetIdMapper.getSequentialId(urlId)
  const getUrlId = (sequentialId: number) => BetIdMapper.getUrlId(sequentialId)
  const isValidUrlId = (urlId: string) => BetIdMapper.isValidUrlId(urlId)
  
  return {
    createUrlId,
    getSequentialId, 
    getUrlId,
    isValidUrlId
  }
}