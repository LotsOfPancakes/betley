// lib/hooks/useBetIdMapping.ts
import { useState, useEffect } from 'react'
import { BetIdMapper, BetMapping } from '@/lib/betIdMapping'

export function useBetIdMapping() {
  const [mappings, setMappings] = useState<BetMapping[]>([])

  useEffect(() => {
    setMappings(BetIdMapper.getAllMappings())
  }, [])

  const addMapping = (numericId: number, name: string, creator: string): string => {
    const randomId = BetIdMapper.addMapping(numericId, name, creator)
    setMappings(BetIdMapper.getAllMappings())
    return randomId
  }

  const getNumericId = (randomId: string): number | null => {
    return BetIdMapper.getNumericId(randomId)
  }

 const getRandomId = (numericId: number): string | null => {
    return BetIdMapper.getRandomId(numericId) ?? null  // ✅ Convert undefined to null
}

  const getMapping = (randomId: string): BetMapping | null => {
    return BetIdMapper.getMapping(randomId)
  }

  const refreshMappings = () => {
    setMappings(BetIdMapper.getAllMappings())
  }

  return {
    mappings,
    addMapping,
    getNumericId,
    getRandomId,
    getMapping,
    refreshMappings
  }
}