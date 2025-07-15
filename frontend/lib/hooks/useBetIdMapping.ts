// frontend/lib/hooks/useBetIdMapping.ts - CLEANED VERSION
import { useState, useEffect } from 'react'
import { UnifiedBetMapper, BetMapping } from '@/lib/betIdMapping'

// Hook for single ID mapping (what the page expects)
export function useBetIdMapping(randomId: string) {
  const [isLoading, setIsLoading] = useState(true)
  const [numericBetId, setNumericBetId] = useState<number | null>(null)
  const [isValidId, setIsValidId] = useState(false)

  useEffect(() => {
    if (!randomId) {
      setIsLoading(false)
      setNumericBetId(null)
      setIsValidId(false)
      return
    }

    // Small delay to ensure localStorage is read properly
    const timer = setTimeout(() => {
      const mappedId = UnifiedBetMapper.getNumericId(randomId)
      setNumericBetId(mappedId)
      setIsValidId(mappedId !== null)
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [randomId])

  return {
    numericBetId,
    isValidId,
    isLoading
  }
}

// Hook for managing all mappings (existing functionality)
export function useBetIdMappingManager() {
  const [mappings, setMappings] = useState<BetMapping[]>([])

  useEffect(() => {
    setMappings(UnifiedBetMapper.getAllMappings())
  }, [])

  const addMapping = (numericId: number, name: string, creator: string): string => {
    const randomId = UnifiedBetMapper.createMapping(numericId, name, creator)
    setMappings(UnifiedBetMapper.getAllMappings())
    return randomId
  }

  const getNumericId = (randomId: string): number | null => {
    return UnifiedBetMapper.getNumericId(randomId)
  }

  const getRandomId = (numericId: number): string | undefined => {
    return UnifiedBetMapper.getRandomId(numericId)
  }

  const getMapping = (randomId: string): BetMapping | null => {
    return UnifiedBetMapper.getMapping(randomId)
  }

  const refreshMappings = () => {
    setMappings(UnifiedBetMapper.getAllMappings())
  }

  const isValidRandomId = (randomId: string): boolean => {
    return UnifiedBetMapper.isValidRandomId(randomId)
  }

  return {
    mappings,
    addMapping,
    getNumericId,
    getRandomId,
    getMapping,
    refreshMappings,
    isValidRandomId
  }
}