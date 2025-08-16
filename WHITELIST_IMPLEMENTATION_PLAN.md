# Betley Whitelist Management - Implementation Plan

## 🎯 Objective
Enhance the whitelist management modal to display existing whitelisted addresses from the database and allow removal via UI buttons.

## 🔍 Current State Analysis

### ✅ What's Already Implemented
- **Smart Contract**: Full whitelist functionality in `contracts/src/Betley.sol`
  - Functions: `addToWhitelist()`, `removeFromWhitelist()`, `disableWhitelist()`
  - View functions: `isWhitelisted()`, `getWhitelistStatus()`, `canUserPlaceBet()`
- **Database Schema**: `bet_whitelist` table exists (`database/add_whitelist_support.sql`)
  - Columns: `bet_id`, `participant_address`, `added_by`, `added_at`
  - Proper indexes and RLS policies
- **Frontend Modal**: `WhitelistModal.tsx` with basic add/pending functionality
- **Database Storage**: Whitelist addresses saved during bet creation (`/api/bets/create/route.ts`)

### ❌ What's Missing
- **No API endpoints to READ existing whitelist addresses**
- **No API endpoints to ADD/REMOVE addresses post-creation**
- **UI doesn't display existing whitelisted addresses**
- **No remove (X) buttons for existing addresses**

## 📋 Implementation Tasks

### Phase 1: API Endpoints (Priority: HIGH)

#### Task 1: GET /api/bets/[id]/whitelist
**File**: `frontend/app/api/bets/[id]/whitelist/route.ts`

**Purpose**: Fetch all whitelisted addresses for a specific bet

**Implementation**:
```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Get bet_id from random_id
    const { data: betMapping } = await supabase
      .from('bet_mappings')
      .select('id, has_whitelist')
      .eq('random_id', params.id)
      .single()

    if (!betMapping) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    }

    // 2. Fetch whitelist addresses
    const { data: addresses } = await supabase
      .from('bet_whitelist')
      .select('participant_address, added_at, added_by')
      .eq('bet_id', betMapping.id)
      .order('added_at', { ascending: false })

    // 3. Return response
    return NextResponse.json({
      success: true,
      data: {
        hasWhitelist: betMapping.has_whitelist,
        addresses: addresses || []
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "hasWhitelist": true,
    "addresses": [
      {
        "participant_address": "0x1234...5678",
        "added_at": "2024-01-15T10:30:00Z",
        "added_by": "0xabcd...creator"
      }
    ]
  }
}
```

#### Task 2: POST /api/bets/[id]/whitelist
**File**: Same file as above

**Purpose**: Add new address(es) to existing bet whitelist

**Implementation**:
```typescript
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { addresses, addedBy } = await request.json()

    // 1. Validate inputs
    if (!addresses || !Array.isArray(addresses) || !addedBy) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // 2. Get bet_id and verify creator
    const { data: betMapping } = await supabase
      .from('bet_mappings')
      .select('id, creator_address')
      .eq('random_id', params.id)
      .single()

    if (!betMapping) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    }

    // 3. Verify caller is creator
    if (betMapping.creator_address.toLowerCase() !== addedBy.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 4. Prepare whitelist data
    const whitelistData = addresses.map(addr => ({
      bet_id: betMapping.id,
      participant_address: addr.toLowerCase(),
      added_by: addedBy.toLowerCase()
    }))

    // 5. Insert addresses (ignore duplicates)
    const { data, error } = await supabase
      .from('bet_whitelist')
      .insert(whitelistData)
      .select()

    if (error && !error.message.includes('duplicate')) {
      throw error
    }

    // 6. Update has_whitelist flag
    await supabase
      .from('bet_mappings')
      .update({ has_whitelist: true })
      .eq('id', betMapping.id)

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

#### Task 3: DELETE /api/bets/[id]/whitelist
**File**: Same file as above

**Purpose**: Remove address from bet whitelist

**Implementation**:
```typescript
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { address, removedBy } = await request.json()

    // 1. Validate inputs
    if (!address || !removedBy) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // 2. Get bet_id and verify creator
    const { data: betMapping } = await supabase
      .from('bet_mappings')
      .select('id, creator_address')
      .eq('random_id', params.id)
      .single()

    if (!betMapping) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    }

    // 3. Verify caller is creator
    if (betMapping.creator_address.toLowerCase() !== removedBy.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 4. Remove address from whitelist
    const { error } = await supabase
      .from('bet_whitelist')
      .delete()
      .eq('bet_id', betMapping.id)
      .eq('participant_address', address.toLowerCase())

    if (error) throw error

    // 5. Check if any addresses remain
    const { data: remainingAddresses } = await supabase
      .from('bet_whitelist')
      .select('id')
      .eq('bet_id', betMapping.id)
      .limit(1)

    // 6. Update has_whitelist flag if no addresses remain
    if (!remainingAddresses || remainingAddresses.length === 0) {
      await supabase
        .from('bet_mappings')
        .update({ has_whitelist: false })
        .eq('id', betMapping.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Phase 2: UI Components (Priority: MEDIUM)

#### Task 4: Enhance WhitelistModal.tsx
**File**: `frontend/app/bets/[id]/components/WhitelistModal.tsx`

**Required Changes**:

1. **Add new state for existing addresses**:
```typescript
interface WhitelistedAddress {
  participant_address: string
  added_at: string
  added_by: string
}

const [existingAddresses, setExistingAddresses] = useState<WhitelistedAddress[]>([])
const [isLoadingExisting, setIsLoadingExisting] = useState(true)
const [isRemoving, setIsRemoving] = useState<string | null>(null)
```

2. **Add fetch function**:
```typescript
const fetchExistingAddresses = async () => {
  try {
    setIsLoadingExisting(true)
    const response = await fetch(`/api/bets/${betId}/whitelist`)
    const data = await response.json()
    
    if (data.success) {
      setExistingAddresses(data.data.addresses)
    }
  } catch (error) {
    console.error('Error fetching whitelist:', error)
  } finally {
    setIsLoadingExisting(false)
  }
}
```

3. **Add useEffect to fetch on modal open**:
```typescript
useEffect(() => {
  if (isOpen) {
    fetchExistingAddresses()
  }
}, [isOpen, betId])
```

4. **Add remove function**:
```typescript
const handleRemoveFromWhitelist = async (address: string) => {
  if (!connectedAddress || isRemoving) return

  try {
    setIsRemoving(address)

    // 1. Contract operation (source of truth)
    await writeContract({
      address: BETLEY_ADDRESS,
      abi: BETLEY_ABI,
      functionName: 'removeFromWhitelist',
      args: [BigInt(contractBetId), address as `0x${string}`],
    })

    // 2. Database operation (convenience storage)
    const response = await fetch(`/api/bets/${betId}/whitelist`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        address,
        removedBy: connectedAddress 
      })
    })

    if (!response.ok) throw new Error('Database update failed')

    // 3. Update local state
    setExistingAddresses(prev => 
      prev.filter(addr => addr.participant_address !== address)
    )

    // 4. Refresh contract data
    await refetchWhitelistStatus()
    await refetchCurrentUserStatus()

  } catch (error) {
    console.error('Error removing from whitelist:', error)
  } finally {
    setIsRemoving(null)
  }
}
```

5. **Update handleAddToWhitelist to sync with database**:
```typescript
const handleAddToWhitelist = async () => {
  if (!address || whitelistAddresses.length === 0) return

  try {
    // 1. Contract operations (source of truth)
    for (const addr of whitelistAddresses) {
      await writeContract({
        address: BETLEY_ADDRESS,
        abi: BETLEY_ABI,
        functionName: 'addToWhitelist',
        args: [BigInt(contractBetId), addr as `0x${string}`],
      })
    }

    // 2. Database operation (convenience storage)
    const response = await fetch(`/api/bets/${betId}/whitelist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addresses: whitelistAddresses,
        addedBy: address
      })
    })

    if (!response.ok) {
      console.warn('Database sync failed, but contract operations succeeded')
    }

    // 3. Update local state
    setWhitelistAddresses([])
    await fetchExistingAddresses() // Refresh existing addresses
    await refetchWhitelistStatus()
    await refetchCurrentUserStatus()

  } catch (error) {
    console.error('Error adding to whitelist:', error)
  }
}
```

6. **Add new UI section for existing addresses**:
```typescript
{/* Current Whitelisted Addresses */}
{whitelistEnabled && (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-300">
      Current Whitelisted Addresses ({existingAddresses.length})
    </label>
    
    {isLoadingExisting ? (
      <div className="p-4 text-center text-gray-400">Loading...</div>
    ) : existingAddresses.length > 0 ? (
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {existingAddresses.map((addr) => (
          <div
            key={addr.participant_address}
            className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <span className="text-sm font-mono text-white truncate block">
                {addr.participant_address}
              </span>
              <span className="text-xs text-gray-400">
                Added {new Date(addr.added_at).toLocaleDateString()}
              </span>
            </div>
            <button
              onClick={() => handleRemoveFromWhitelist(addr.participant_address)}
              disabled={isRemoving === addr.participant_address}
              className="ml-3 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              {isRemoving === addr.participant_address ? '...' : '✕'}
            </button>
          </div>
        ))}
      </div>
    ) : (
      <div className="p-4 text-center text-gray-400 bg-gray-800 rounded-lg">
        No addresses whitelisted yet
      </div>
    )}
  </div>
)}
```

## 🔧 Technical Considerations

### Database-Contract Synchronization Strategy
- **Source of Truth**: Smart contract is the ultimate authority
- **Database Role**: Convenience storage for UI display and history
- **Error Handling**: Database failures don't block contract operations
- **Sync Pattern**: Contract operation first, then database update

### Performance Optimizations
- Use React Query for caching whitelist data
- Implement optimistic UI updates
- Add loading states for better UX
- Use database indexes for fast lookups

### Security Considerations
- Verify creator authorization on all operations
- Validate Ethereum addresses before processing
- Use RLS policies for database access control
- Sanitize inputs to prevent injection attacks

## 🧪 Testing Checklist

### API Endpoints
- [ ] GET returns correct whitelist data
- [ ] POST adds addresses successfully
- [ ] DELETE removes addresses correctly
- [ ] Authorization checks work properly
- [ ] Error handling for invalid inputs
- [ ] Database constraints prevent duplicates

### UI Components
- [ ] Modal displays existing addresses
- [ ] Remove buttons work correctly
- [ ] Loading states show appropriately
- [ ] Error messages display properly
- [ ] Contract and database stay in sync
- [ ] Optimistic updates work smoothly

## 📁 Files to Modify

1. **`frontend/app/api/bets/[id]/whitelist/route.ts`** (NEW FILE)
   - All three HTTP methods (GET, POST, DELETE)

2. **`frontend/app/bets/[id]/components/WhitelistModal.tsx`** (MODIFY)
   - Add state management for existing addresses
   - Add UI section for current whitelisted addresses
   - Add remove functionality with database sync
   - Update add functionality to sync with database

## 🚀 Deployment Steps

1. **Apply database migration** (if not done):
   ```sql
   -- Run: database/add_whitelist_support.sql
   ```

2. **Create API endpoints** in the specified file

3. **Test API endpoints** with Postman/curl

4. **Update WhitelistModal component** with new functionality

5. **Test complete flow** from frontend

6. **Verify contract-database synchronization**

## 💡 Future Enhancements (Optional)

- Batch operations for multiple address changes
- Export whitelist to CSV functionality
- Whitelist templates for reuse across bets
- Audit log for whitelist changes
- Real-time updates via WebSockets

---

**Implementation Priority**: Complete Phase 1 (API endpoints) first, then Phase 2 (UI components). This ensures a solid foundation before enhancing the user interface.