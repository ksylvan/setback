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

- [ ] Trick winner is correctly determined based on cards played
- [ ] Trump cards always beat non-trump cards regardless of rank
- [ ] Highest trump wins when multiple trump cards played
- [ ] Highest card of lead suit wins when no trump played
- [ ] Joker is treated as highest trump card
- [ ] Off-jack (same color jack) is treated as trump
- [ ] Trick winner leads the next trick
- [ ] All 6 tricks per hand are properly tracked

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

- [ ] Test `evaluateTrick()` with all trump hierarchy combinations
- [ ] Test joker vs all other cards (should always win)
- [ ] Test off-jack identification and trump treatment
- [ ] Test trump vs non-trump scenarios
- [ ] Test lead suit vs off-suit when no trump played
- [ ] Test `Card.compareForTrump()` method extensions
- [ ] Test trick completion and state transitions
- [ ] Test hand completion detection logic

### Integration Tests

- [ ] Test complete 4-card trick evaluation flow
- [ ] Test 6-trick hand completion with various trump scenarios
- [ ] Test trick winner becomes next trick leader
- [ ] Test game state consistency after trick completion
- [ ] Test event emissions for UI updates
- [ ] Test interaction with card playing mechanics (SB-001)

### Edge Case Tests

- [ ] Test all-trump tricks with proper hierarchy
- [ ] Test tricks with multiple off-jacks (different colors)
- [ ] Test joker played as first card vs other scenarios
- [ ] Test tricks with no trump cards played
- [ ] Test proper handling when trump suit changes

### Coverage Targets

- [ ] Maintain 80%+ line coverage for trick evaluation logic
- [ ] Maintain 80%+ branch coverage for trump hierarchy decisions
- [ ] Maintain 80%+ function coverage for new methods

## Definition of Done

- [ ] Trick evaluation correctly implements all trump rules
- [ ] Joker and off-jack special cases handled properly
- [ ] Trick winner always leads next trick
- [ ] Hand completion detection works correctly
- [ ] Unit tests written with 80%+ coverage
- [ ] Integration tests pass without regressions
- [ ] Edge case tests cover all trump scenarios
- [ ] TypeScript compilation successful
- [ ] All existing tests continue to pass
- [ ] Performance: trick evaluation under 10ms
- [ ] Manual testing of complex trick scenarios completed

## Notes

- Off-jack logic is complex: jack of same color as trump becomes trump
- Example: If hearts are trump, jack of diamonds becomes trump card
- Joker can be played at any time and always wins the trick
- Need to track all 6 tricks per hand for scoring calculation
- Consider tie scenarios (shouldn't happen with proper rules)
