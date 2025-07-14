'use client'

import { isNativeHype, getTokenConfig, getAvailableTokens, ZERO_ADDRESS, needsApproval, getTokenDisplayName } from '@/lib/tokenUtils'
import { useSmartApproval } from '@/lib/hooks/useSmartApproval'
import { BETLEY_ADDRESS } from '@/lib/contractABI'

export function TokenTest() {
  // Test the smart approval hook
  const nativeApproval = useSmartApproval({
    tokenAddress: ZERO_ADDRESS,
    amount: '1.0',
    spender: BETLEY_ADDRESS
  })
  
  const mockHypeApproval = useSmartApproval({
    tokenAddress: '0xE9E98a2e2Bc480E2805Ebea6b6CDafAd41b7257C',
    amount: '1.0',
    spender: BETLEY_ADDRESS
  })

  const handleTest = () => {
    console.log('=== BETLEY TOKEN UTILS TEST ===')
    
    // Test 1: Native HYPE detection
    console.log('✅ Test 1 - Native HYPE Detection:')
    console.log('  isNativeHype(ZERO_ADDRESS):', isNativeHype(ZERO_ADDRESS)) // Should be true
    console.log('  isNativeHype(Mock HYPE):', isNativeHype('0xE9E98a2e2Bc480E2805Ebea6b6CDafAd41b7257C')) // Should be false
    
    // Test 2: Token configurations
    console.log('\n✅ Test 2 - Token Configurations:')
    console.log('  Native HYPE config:', getTokenConfig(ZERO_ADDRESS))
    console.log('  Mock HYPE config:', getTokenConfig('0xE9E98a2e2Bc480E2805Ebea6b6CDafAd41b7257C'))
    
    // Test 3: Approval requirements
    console.log('\n✅ Test 3 - Approval Requirements:')
    console.log('  Native HYPE needs approval for 1.0:', needsApproval(ZERO_ADDRESS, '1.0')) // Should be false
    console.log('  Mock HYPE needs approval for 1.0:', needsApproval('0xE9E98a2e2Bc480E2805Ebea6b6CDafAd41b7257C', '1.0')) // Should be true
    console.log('  Mock HYPE needs approval for 0:', needsApproval('0xE9E98a2e2Bc480E2805Ebea6b6CDafAd41b7257C', '0')) // Should be false
    
    // Test 4: Available tokens
    console.log('\n✅ Test 4 - Available Tokens:')
    console.log('  Available tokens:', getAvailableTokens())
    
    // Test 5: Display names
    console.log('\n✅ Test 5 - Display Names:')
    console.log('  Native HYPE display:', getTokenDisplayName(ZERO_ADDRESS))
    console.log('  Mock HYPE display:', getTokenDisplayName('0xE9E98a2e2Bc480E2805Ebea6b6CDafAd41b7257C'))
    
    // Test 6: Smart Approval Hook
    console.log('\n✅ Test 6 - Smart Approval Hook:')
    console.log('  Native HYPE approval state:', {
      needsApproval: nativeApproval.needsApproval,
      skipApproval: nativeApproval.skipApproval,
      isPending: nativeApproval.isPending
    })
    console.log('  Mock HYPE approval state:', {
      needsApproval: mockHypeApproval.needsApproval,
      skipApproval: mockHypeApproval.skipApproval,
      isPending: mockHypeApproval.isPending,
      currentAllowance: mockHypeApproval.currentAllowance?.toString()
    })
    
    console.log('\n🎉 Token Utils Test Complete! Check results above.')
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <h3 className="text-white font-semibold mb-4">🧪 Token Utils Test</h3>
      <p className="text-gray-300 text-sm mb-4">
        Click the button below to test token utility functions. Check the browser console for results.
      </p>
      <button 
        onClick={handleTest}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        Run Token Utils Test
      </button>
      <p className="text-gray-400 text-xs mt-2">
        Open browser DevTools → Console to see test results
      </p>
    </div>
  )
}