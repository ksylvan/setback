# SB-004: Scoring System Implementation

**Epic:** Core Gameplay
**Priority:** High
**Story Points:** 8
**Dependencies:** SB-003 (Hand Completion Flow)

## User Story

AS A player
I WANT accurate scoring after each hand
SO THAT partnerships accumulate points correctly toward the 21-point win condition

## Acceptance Criteria

- [ ] All 6 scoring categories are calculated correctly (High, Low, Jack, Off-Jack, Joker, Game)
- [ ] Bidding partnership scores bid amount if they make it, loses bid amount if they don't
- [ ] Non-bidding partnership always scores points they actually earned
- [ ] "Game" points (small points) are correctly calculated and awarded
- [ ] Partnerships can have negative scores if they fail bids
- [ ] Score updates are reflected in partnership totals
- [ ] Hand scoring breakdown is available for display

## Technical Details

### Scoring Categories (3-6 points available per hand)

1. **High Trump (1 point)** - Partnership that takes highest trump card
2. **Low Trump (1 point)** - Partnership that takes lowest trump card
3. **Jack of Trump (1 point)** - Partnership that takes jack of trump (if dealt)
4. **Off-Jack (1 point)** - Partnership that takes jack of same color as trump (if dealt)
5. **Joker (1 point)** - Partnership that takes joker (if dealt)
6. **Game Points (1 point)** - Partnership with majority of small points

### Small Points Values

- **Jack**: 1 point
- **Queen**: 2 points
- **King**: 3 points
- **Ace**: 4 points
- **Ten**: 10 points

### Implementation Approach

```typescript
interface HandScoreResult {
  points: {
    high: { winner: string; card: Card } | null;
    low: { winner: string; card: Card } | null;
    jack: { winner: string; card: Card } | null;
    offJack: { winner: string; card: Card } | null;
    joker: { winner: string; card: Card } | null;
    game: { winner: string; smallPoints: number } | null;
  };
  bidMade: boolean;
  biddingPartnership: string;
  nonBiddingPartnership: string;
}

// New methods in GameManager
private scoreHand(): HandScoreResult
private calculateSmallPoints(partnership: Partnership): number
private findHighestTrump(tricks: Trick[]): { winner: string; card: Card } | null
private findLowestTrump(tricks: Trick[]): { winner: string; card: Card } | null
private updatePartnershipScores(scoreResult: HandScoreResult): void
```

### Scoring Logic Flow

1. **Identify Trump Cards** - Find all trump cards taken in tricks
2. **Calculate High/Low** - Highest and lowest trump cards taken
3. **Check Special Cards** - Jack of trump, off-jack, joker (if dealt)
4. **Calculate Small Points** - Sum point values for each partnership
5. **Determine Game Winner** - Partnership with most small points
6. **Apply Bid Results** - Bidders make/miss bid, non-bidders get actual points

### Bid Success/Failure Logic

```typescript
// Bidding partnership scoring
if (scoreResult.bidMade) {
  biddingPartnership.score += currentBid.amount;
} else {
  biddingPartnership.score -= currentBid.amount; // Can go negative
}

// Non-bidding partnership always gets actual points
nonBiddingPartnership.score += actualPointsEarned;
```

## Testing Requirements

### Unit Tests

- [ ] Test `scoreHand()` with all possible scoring combinations
- [ ] Test `calculateSmallPoints()` with various trick outcomes
- [ ] Test `findHighestTrump()` and `findLowestTrump()` edge cases
- [ ] Test bid success/failure logic with different point totals
- [ ] Test negative scoring for failed bids
- [ ] Test partnership score updates and state consistency
- [ ] Test scoring when special cards (jack, off-jack, joker) not dealt
- [ ] Test game points tie-breaking logic

### Integration Tests

- [ ] Test complete hand scoring flow from tricks to final scores
- [ ] Test scoring integration with trick-taking logic (SB-002)
- [ ] Test partnership score accumulation across multiple hands
- [ ] Test game end detection when partnership reaches 21 points
- [ ] Test score event emission for UI updates
- [ ] Test scoring with various trump suits and card combinations

### Edge Case Tests

- [ ] Test scoring when no trump cards are taken
- [ ] Test scoring when all trump cards taken by one partnership
- [ ] Test small points tie scenarios (50-50 split)
- [ ] Test hands where joker or special cards aren't dealt
- [ ] Test maximum possible points in single hand (6 points)
- [ ] Test minimum possible points (negative scoring scenarios)
- [ ] Test score calculation with different bid amounts (2-6)

### Data Validation Tests

- [ ] Test that total awarded points never exceed maximum possible
- [ ] Test that high trump is always higher rank than low trump
- [ ] Test that off-jack is correctly identified by color matching
- [ ] Test that small points sum to exactly 30 per hand (if all dealt)

### Coverage Targets

- [ ] Maintain 80%+ line coverage for all scoring methods
- [ ] Maintain 80%+ branch coverage for bid success/failure logic
- [ ] Maintain 80%+ function coverage for scoring calculations

## Definition of Done

- [ ] All 6 scoring categories implemented correctly
- [ ] Small points calculation matches Setback rules exactly
- [ ] Bid success/failure logic correctly applied
- [ ] Partnership scores updated in game state
- [ ] Negative scores supported for failed bids
- [ ] Unit tests written with 80%+ coverage
- [ ] Integration tests pass without regressions
- [ ] Edge case tests cover all scoring scenarios
- [ ] Data validation tests ensure scoring integrity
- [ ] TypeScript compilation successful
- [ ] All existing tests continue to pass
- [ ] Manual testing of complex scoring scenarios completed
- [ ] Performance: hand scoring completes under 50ms

## Notes

- **High/Low Logic**: Only trump cards count, including joker and off-jack
- **Off-Jack Special Case**: Jack of same color as trump becomes trump for scoring
- **Game Points Tie**: If partnerships tie on small points, bidding partnership wins
- **Point Validation**: Total points available = 3 (High,Low,Game) + up to 3 special cards
- **Score Display**: Consider emitting detailed scoring events for UI breakdown
