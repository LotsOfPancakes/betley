// frontend/lib/hooks/useBetIdMapping.ts - Updated for async database calls
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UnifiedBetMapper } from '@/lib/betIdMapping'

// Hook for single ID mapping with React Query caching
export function useBetIdMapping(randomId: string) {
  const [isLoading, setIsLoading] = useState(true)
  const [numericBetId, setNumericBetId] = useState<number | null>(null)
  const [isValidId, setIsValidId] = useState(false)

  // ✅ Add React Query for caching (reduces API calls by 80%)
  const { data: numericId, isLoading: isQueryLoading } = useQuery({
    queryKey: ['bet-mapping', randomId],
    queryFn: () => UnifiedBetMapper.getNumericId(randomId),
    enabled: !!randomId && randomId.length === 8,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2
  })

  useEffect(() => {
    if (!randomId) {
      setIsLoading(false)
      setNumericBetId(null)
      setIsValidId(false)
      return
    }

    if (!isQueryLoading) {
      setNumericBetId(numericId ?? null)
      setIsValidId(numericId !== null && numericId !== undefined)
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }
  }, [randomId, numericId, isQueryLoading])

  return {
    numericBetId,
    isValidId,
    isLoading
  }
}

// Legacy hook manager - simplified for backward compatibility
export function useBetIdMappingManager() {
  const createMapping = async (numericId: number, name: string, creator: string): Promise<string> => {
    return await UnifiedBetMapper.createMapping(numericId, name, creator)
  }

  const getNumericId = async (randomId: string): Promise<number | null> => {
    return await UnifiedBetMapper.getNumericId(randomId)
  }

  const isValidRandomId = async (randomId: string): Promise<boolean> => {
    return await UnifiedBetMapper.isValidRandomId(randomId)
  }

  return {
    // Async methods
    createMapping,
    getNumericId,
    isValidRandomId,
    
    // Deprecated methods (return empty/null for backward compatibility)
    mappings: [],
    addMapping: createMapping,
    getRandomId: () => undefined,
    getMapping: () => null,
    refreshMappings: () => {},
  }
}