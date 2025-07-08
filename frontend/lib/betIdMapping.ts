// lib/betIdMapping.ts
export interface BetMapping {
  randomId: string
  numericId: number
  name: string
  creator: string
  createdAt: number
}

export class BetIdMapper {
  private static STORAGE_KEY = 'betley_bet_mappings'

  static generateRandomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

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

  static saveMappings(mappings: BetMapping[]): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mappings))
    } catch (error) {
      console.error('Error saving bet mappings:', error)
    }
  }

  static addMapping(numericId: number, name: string, creator: string): string {
    const randomId = this.generateRandomId()
    const mappings = this.getAllMappings()
    
    const existingIndex = mappings.findIndex(m => m.numericId === numericId)
    
    const newMapping: BetMapping = {
      randomId,
      numericId,
      name,
      creator,
      createdAt: Date.now()
    }

    if (existingIndex >= 0) {
      mappings[existingIndex] = newMapping
    } else {
      mappings.push(newMapping)
    }

    this.saveMappings(mappings)
    return randomId
  }

  static getNumericId(randomId: string): number | null {
    const mappings = this.getAllMappings()
    const mapping = mappings.find(m => m.randomId === randomId)
    return mapping ? mapping.numericId : null
  }

  static getRandomId(numericId: number): string | null {
    const mappings = this.getAllMappings()
    const mapping = mappings.find(m => m.numericId === numericId)
    return mapping ? mapping.randomId : null
  }

  static getMapping(randomId: string): BetMapping | null {
    const mappings = this.getAllMappings()
    return mappings.find(m => m.randomId === randomId) || null
  }

  static async discoverMissingMappings(betCounter: number, getBetDetails: (id: number) => Promise<any>) {
    const mappings = this.getAllMappings()
    const existingNumericIds = mappings.map(m => m.numericId)

    for (let i = 0; i < betCounter; i++) {
      if (!existingNumericIds.includes(i)) {
        try {
          const details = await getBetDetails(i)
          if (details) {
            this.addMapping(i, details.name, details.creator)
          }
        } catch (error) {
          console.error(`Error discovering bet ${i}:`, error)
        }
      }
    }
  }
}