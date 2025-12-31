# Critical Bugfix: Queue State Persistence Override

**Date**: 2025-12-31
**Severity**: CRITICAL
**Status**: RESOLVED

## Executive Summary

A catastrophic bug rendered the queue system completely non-functional for logged-in users. All queue modification operations (remove, add, clear, next/previous) failed silently, creating an "eternal playlist" that could not be changed. The bug was caused by an infinite state override loop where database state constantly overwrote local changes.

## Symptoms

Users experienced:
- ❌ Cannot remove tracks from queue (X button non-functional)
- ❌ Cannot clear queue (trash icon non-functional)
- ❌ Cannot add new tracks to queue
- ❌ Next/Previous navigation buttons non-functional
- ❌ Queue frozen with same tracks indefinitely
- ❌ First song plays in eternal loop

## Root Cause Analysis

### The Bug

File: `src/hooks/useAudioPlayer.ts`
Line: 214 (before fix)

```typescript
// ❌ BROKEN: Dependency array includes initialQueueState
useEffect(() => {
  // ... load queue from database or localStorage
  if (initialQueueState && initialQueueState.queuedTracks.length > 0) {
    setQueuedTracks(initialQueueState.queuedTracks);
    setSmartQueueState(initialQueueState.smartQueueState);
    // ... reset all queue state
  }
}, [initialQueueState]); // ❌ BUG: Runs on every initialQueueState change!
```

### The Override Loop

1. **User Action**: User removes a track from the queue
2. **State Update**: `setQueuedTracks((prev) => prev.filter((_, i) => i !== index))`
3. **Re-render**: Component re-renders with updated `queuedTracks`
4. **Recalculation**: `AudioPlayerContext` recalculates `initialQueueState` from `dbQueueState` (which hasn't changed yet because save is debounced by 1 second)
5. **useEffect Trigger**: useEffect in `useAudioPlayer` runs because `initialQueueState` reference changed
6. **State Override**: Lines 143-147 reset queue back to database state
7. **Change Lost**: User's modification is immediately overwritten

This created an infinite loop where local changes were instantly reverted.

### Why initialQueueState Changed on Every Render

File: `src/contexts/AudioPlayerContext.tsx`
Lines: 194-208 (before fix)

```typescript
// ❌ COMPUTED ON EVERY RENDER
const initialQueueState = session && dbQueueState && ... ? {
  queuedTracks: dbQueueState.queuedTracks.map(...), // New array reference
  smartQueueState: { ... }, // New object reference
  // ...
} : undefined;
```

Even if `dbQueueState` didn't change, the object was reconstructed on every render, creating a new reference that React detected as a change.

## The Fix

### Primary Fix

File: `src/hooks/useAudioPlayer.ts`
Lines: 214-215 (after fix)

```typescript
// ✅ FIXED: Empty dependency array - only run on mount
useEffect(() => {
  // ... load queue from database or localStorage
  if (initialQueueState && initialQueueState.queuedTracks.length > 0) {
    console.log("[useAudioPlayer] 📥 Restoring queue state from database (ONCE on mount)");
    setQueuedTracks(initialQueueState.queuedTracks);
    setSmartQueueState(initialQueueState.smartQueueState);
    // ... initialize queue state
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // ✅ Empty array! Only run on mount, not when initialQueueState changes
```

**Rationale**: Queue state should only be loaded from the database **once on component mount**, not on every render. After that, local state changes should persist until explicitly saved.

### Supporting Fixes

#### 1. Date Type Conversion (Database)

File: `src/contexts/AudioPlayerContext.tsx`
Lines: 195-204

**Problem**: Database returns dates as strings (JSON serialization), but `QueuedTrack` expects `Date` objects. This caused React's state comparison to fail.

```typescript
// ✅ FIXED: Convert string dates to Date objects
queuedTracks: dbQueueState.queuedTracks.map((qt: any) => ({
  ...qt,
  addedAt: new Date(qt.addedAt), // String → Date conversion
})) as QueuedTrack[],
```

#### 2. Date Type Conversion (localStorage)

File: `src/hooks/useQueuePersistence.ts`
Lines: 80-95

```typescript
// ✅ FIXED: Convert persisted string dates to Date objects
return {
  ...v2Data,
  queuedTracks: v2Data.queuedTracks.map((qt: any) => ({
    ...qt,
    addedAt: new Date(qt.addedAt),
  })),
  smartQueueState: {
    ...v2Data.smartQueueState,
    lastRefreshedAt: v2Data.smartQueueState.lastRefreshedAt
      ? new Date(v2Data.smartQueueState.lastRefreshedAt)
      : null,
  },
} as QueueStateV2;
```

#### 3. Missing Schema Field

File: `src/server/api/routers/music.ts`
Line: 834

**Problem**: `SmartQueueState` interface requires `trackCount` field, but server schema was missing it.

```typescript
smartQueueState: z.object({
  isActive: z.boolean(),
  lastRefreshedAt: z.string().nullable(),
  seedTrackId: z.number().nullable(),
  trackCount: z.number(), // ✅ Added missing field
}),
```

#### 4. Button onClick Handlers

File: `src/components/EnhancedQueue.tsx`
Lines: 962, 969, 1009

**Problem**: Smart queue buttons were passing `MouseEvent` to functions expecting different parameters.

```typescript
// ❌ BROKEN
onClick={onAddSmartTracks}

// ✅ FIXED
onClick={() => onAddSmartTracks()}
```

## Impact

- **Severity**: CRITICAL
- **Affected Users**: All logged-in users
- **Affected Features**: All queue operations
- **Duration**: Unknown (bug introduced during queue refactor)
- **Data Loss**: No permanent data loss (database state preserved)

## Testing

### Verification Steps

1. Refresh the page to load fixed code
2. Add 3-5 tracks to queue
3. Remove one track (X button) → Should disappear
4. Add another track → Should appear
5. Click Next/Previous → Should navigate correctly
6. Clear queue → Should remove all tracks except current
7. Refresh page → Queue state should persist

### Expected Behavior

- ✅ Track removals persist
- ✅ Track additions persist
- ✅ Queue navigation works
- ✅ Clear queue works
- ✅ State persists across page refreshes
- ✅ Database saves updated state after 1-second debounce

## Lessons Learned

### 1. Dependency Arrays Matter

**Mistake**: Including derived/computed values in dependency arrays without understanding their recalculation behavior.

**Solution**: Carefully audit what causes dependencies to change. If a value is computed from props/context on every render, including it in a dependency array causes the effect to run on every render.

### 2. Type Conversions in Serialization

**Mistake**: Casting serialized data (JSON) directly to TypeScript types without converting primitive types.

**Solution**: Always convert dates, RegExps, and other non-JSON primitives when deserializing. Create explicit conversion functions.

### 3. State Initialization vs. State Updates

**Mistake**: Using the same mechanism (useEffect with dependencies) for both initial state load and state updates.

**Solution**: Clearly separate initialization (run once on mount with `[]` dependency) from reactive updates (run when specific values change).

### 4. Function Parameter Types

**Mistake**: Passing event handlers directly to functions without wrapper functions when parameter types don't match.

**Solution**: Always wrap in arrow functions: `onClick={() => fn()}` instead of `onClick={fn}` when `fn` doesn't expect a `MouseEvent`.

## Related Issues

- Date type mismatches in persistence layer
- Missing schema validation for `trackCount`
- Button handler type mismatches
- Initial queue refactor introduced this regression

## Resolution Timeline

1. **Bug Reported**: User reported "eternal playlist" issue
2. **Investigation**: Traced through state flow and persistence logic
3. **Root Cause Found**: Discovered `[initialQueueState]` dependency causing override loop
4. **Fix Applied**: Changed to empty dependency array `[]`
5. **Supporting Fixes**: Fixed date conversions and schema issues
6. **Tested**: Verified queue operations work correctly
7. **Documented**: Created this writeup and updated changelog

## References

- PR: [Link to PR once created]
- Related Commits:
  - Fix useEffect dependency array
  - Fix date type conversions
  - Add missing trackCount field
  - Fix button onClick handlers
- Issue: [Link to issue if tracked]

---

**Author**: Claude (AI Assistant)
**Reviewed By**: [Pending]
**Approved By**: [Pending]
