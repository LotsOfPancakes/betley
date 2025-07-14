// frontend/lib/hooks/useBetIdMapping.ts - Updated for unified system
import { useState, useEffect } from 'react'
import { UnifiedBetMapper, BetMapping } from '@/lib/betIdMapping'

export function useBetIdMapping() {
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