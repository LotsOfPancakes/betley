// useFeatureFlag.ts - Utility hook for checking bet-specific feature flags

import { useMemo } from 'react'

// Type for database bet details (re-export for convenience)
export interface FeatureFlagBetData {
  featureFlags?: Record<string, boolean>
}

/**
 * Hook to check if a specific feature flag is enabled for a bet
 * @param featureName - Name of the feature flag to check
 * @param betData - Bet data containing feature flags
 * @returns boolean indicating if feature is enabled
 */
export function useFeatureFlag(
  featureName: string, 
  betData?: FeatureFlagBetData | null
): boolean {
  return useMemo(() => {
    // Return false if no bet data or no feature flags
    if (!betData?.featureFlags) {
      return false
    }
    
    // Check if specific feature is enabled
    return betData.featureFlags[featureName] === true
  }, [featureName, betData?.featureFlags])
}

/**
 * Utility function to check feature flags outside of React components
 * @param featureName - Name of the feature flag to check  
 * @param betData - Bet data containing feature flags
 * @returns boolean indicating if feature is enabled
 */
export function checkFeatureFlag(
  featureName: string,
  betData?: FeatureFlagBetData | null
): boolean {
  if (!betData?.featureFlags) {
    return false
  }
  
  return betData.featureFlags[featureName] === true
}

/**
 * Get all enabled feature flags for debugging
 * @param betData - Bet data containing feature flags
 * @returns array of enabled feature names
 */
export function getEnabledFeatures(betData?: FeatureFlagBetData | null): string[] {
  if (!betData?.featureFlags) {
    return []
  }
  
  return Object.entries(betData.featureFlags)
    .filter(([, enabled]) => enabled === true)
    .map(([featureName]) => featureName)
}