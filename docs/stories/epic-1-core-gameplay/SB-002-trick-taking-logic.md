# SB-002: Trick-Taking Logic

**Epic:** Core Gameplay
**Priority:** High
**Story Points:** 5
**Dependencies:** SB-001 (Card Playing Mechanics)

## User Story

AS A player
I WANT tricks to be automatically evaluated and won by the correct player
SO THAT the game progresses according to Setback rules

## Acceptance Criteria

- [x] Trick winner is correctly determined based on cards played
- [x] Trump cards always beat non-trump cards regardless of rank
- [x] Highest trump wins when multiple trump cards played
- [x] Highest card of lead suit wins when no trump played
- [x] Joker is treated as highest trump card
- [x] Off-jack (same color jack) is treated as trump
- [x] Trick winner leads the next trick
- [x] All 6 tricks per hand are properly tracked

## Technical Details

### Implementation Approach

1. **Trick Evaluation Algorithm**

   ```typescript
   private evaluateTrick(trick: Trick, trumpSuit: Suit): string {
     // Priority order:
     // 1. Joker (highest trump)
     // 2. Jack of trump suit
     // 3. Off-jack (same color as trump)
     // 4. Other trump cards by rank
     // 5. Lead suit cards by rank
     // 6. Off-suit cards (cannot win)
   }
   ```

2. **Card Comparison for Tricks**
   - Extend `Card.compareForTrump()` method for comprehensive trick evaluation
   - Handle special cases: joker, jack of trump, off-jack
   - Implement trump hierarchy vs lead suit hierarchy

3. **Key Components**

   ```typescript
   // New methods in GameManager
   private completeTrick(): void
   private evaluateTrick(trick: Trick): string
   private startNextTrick(winnerId: string): void
   private isHandComplete(): boolean
   ```

### Trump Card Hierarchy (High to Low)

1. **Joker** - Always highest trump
2. **Jack of Trump Suit** - Second highest trump
3. **Off-Jack** - Jack of same color as trump (third highest trump)
4. **Ace of Trump** - Then remaining trump by rank
5. **Other Trump Cards** - King, Queen, 10, 9, 8, 7, 6, 5, 4, 3, 2

### Trick Resolution Flow

1. All 4 cards played to current trick
2. Evaluate trick winner using trump hierarchy
3. Award trick to winning player
4. Winner leads next trick (or hand ends if 6th trick)
5. Clear current trick and update game state

## Testing Requirements

### Unit Tests

- [x] Test `evaluateTrick()` with all trump hierarchy combinations
- [x] Test joker vs all other cards (should always win)
- [x] Test off-jack identification and trump treatment
- [x] Test trump vs non-trump scenarios
- [x] Test lead suit vs off-suit when no trump played
- [x] Test `Card.compareForTrump()` method extensions
- [x] Test trick completion and state transitions
- [x] Test hand completion detection logic

### Integration Tests

- [x] Test complete 4-card trick evaluation flow
- [x] Test 6-trick hand completion with various trump scenarios
- [x] Test trick winner becomes next trick leader
- [x] Test game state consistency after trick completion
- [x] Test event emissions for UI updates
- [x] Test interaction with card playing mechanics (SB-001)

### Edge Case Tests

- [x] Test all-trump tricks with proper hierarchy
- [x] Test tricks with multiple off-jacks (different colors)
- [x] Test joker played as first card vs other scenarios
- [x] Test tricks with no trump cards played
- [x] Test proper handling when trump suit changes

### Coverage Targets

- [x] Maintain 80%+ line coverage for trick evaluation logic
- [x] Maintain 80%+ branch coverage for trump hierarchy decisions
- [x] Maintain 80%+ function coverage for new methods

## Definition of Done

- [x] Trick evaluation correctly implements all trump rules
- [x] Joker and off-jack special cases handled properly
- [x] Trick winner always leads next trick
- [x] Hand completion detection works correctly
- [x] Unit tests written with 80%+ coverage
- [x] Integration tests pass without regressions
- [x] Edge case tests cover all trump scenarios
- [x] TypeScript compilation successful
- [x] All existing tests continue to pass
- [x] Performance: trick evaluation under 10ms
- [x] Manual testing of complex trick scenarios completed

## Implementation Progress

### Development Completed

- ✅ **Trick Evaluation Algorithm** - Implemented `evaluateTrick()` method in GameManager
- ✅ **Trump Hierarchy Logic** - Added `compareForTrump()` method to Card class
- ✅ **Trick Completion Flow** - Complete trick → evaluate winner → start next trick
- ✅ **Hand Completion Detection** - Tracks 6 tricks and emits `handComplete` event
- ✅ **Trump Card Identification** - Joker, trump jack, off-jack properly identified
- ✅ **Off-Jack Logic** - Same-color jack treated as trump (hearts/diamonds, clubs/spades)
- ✅ **Comprehensive Testing** - 133 tests covering all trump scenarios and edge cases

### Code Quality Improvements

- ✅ **Biome Linter Setup** - Installed and configured Biome for consistent code quality
- ✅ **Linting Error Resolution** - Fixed all non-null assertion errors and TypeScript issues
- ✅ **VSCode/CLI Consistency** - Configured Biome to match VSCode linting experience
- ✅ **Test Coverage Maintained** - All 133 tests passing throughout refactoring

### Key Implementation Details

- Trump hierarchy: Joker > Jack of Trump > Off-Jack > Ace > King > ... > 2
- `Card.isTrump()` and `Card.isOffJack()` methods handle trump identification
- `GameManager.compareCardsForTrick()` implements complete trick evaluation logic
- Proper event emissions for UI updates: `trickComplete`, `nextTrickStarted`, `handComplete`
- Non-null assertion operators removed in favor of explicit null checks and error handling

### Testing Coverage

- ✅ Trump hierarchy tests (joker, trump jack, off-jack)
- ✅ Multiple trump cards in same trick
- ✅ No trump cards played scenarios
- ✅ Edge cases: incomplete tricks, malformed data
- ✅ Integration tests: complete trick flow, hand completion
- ✅ All acceptance criteria validated through automated tests

## Notes

- Off-jack logic is complex: jack of same color as trump becomes trump
- Example: If hearts are trump, jack of diamonds becomes trump card
- Joker can be played at any time and always wins the trick
- Need to track all 6 tricks per hand for scoring calculation
- Consider tie scenarios (shouldn't happen with proper rules)
- **Biome Configuration:** Disabled `noExplicitAny` and `noBannedTypes` rules to match VSCode settings
- **Code Quality:** All linting errors resolved while maintaining functionality
