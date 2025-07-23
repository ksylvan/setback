# SB-001: Card Playing Mechanics

**Epic:** Core Gameplay
**Priority:** High
**Story Points:** 5
**Dependencies:** None (bidding system already complete)

## User Story

AS A player
I WANT to play cards during the playing phase
SO THAT I can participate in trick-taking and advance the game

## Acceptance Criteria

- [ ] Human player can select and play valid cards from their hand
- [ ] Game enforces suit-following rules (must follow lead suit if possible)
- [ ] Trump suit is established when bid winner plays first card
- [ ] Invalid card selections are prevented with clear feedback
- [ ] Card plays are validated against game rules before acceptance
- [ ] Game state updates correctly after each card play

## Technical Details

### Implementation Approach

1. **Card Play Validation Logic**
   - Extend `GameManager` with `playCard(playerId: string, cardId: string)` method
   - Implement validation in `Card.canFollow()` method (already exists)
   - Add trump suit determination logic when first card is played

2. **Game State Updates**
   - Update `currentTrick` in game state as cards are played
   - Track lead suit for each trick
   - Maintain current player index rotation

3. **Key Components**

   ```typescript
   // New methods in GameManager
   playCard(playerId: string, cardId: string): boolean
   private validateCardPlay(player: Player, card: Card): boolean
   private establishTrumpSuit(firstCard: Card): void
   private addCardToCurrentTrick(playerId: string, card: Card): void
   ```

### Trump Suit Logic

- First card played by bid winner determines trump suit
- Joker cannot be led as first card (special rule)
- Trump suit affects all subsequent trick evaluation

### Validation Rules

- Must follow lead suit if player has cards of that suit
- Can play any card if unable to follow suit
- Cannot play out of turn
- Cannot play same card twice

## Testing Requirements

### Unit Tests

- [ ] Test `playCard()` method with valid and invalid inputs
- [ ] Test `validateCardPlay()` with all rule combinations
- [ ] Test `establishTrumpSuit()` with different first cards
- [ ] Test `addCardToCurrentTrick()` state updates
- [ ] Test trump suit determination edge cases (joker restrictions)
- [ ] Test suit-following validation with various hand compositions

### Integration Tests

- [ ] Test complete card play flow from selection to trick update
- [ ] Test game state consistency after multiple card plays
- [ ] Test event emissions for UI updates
- [ ] Test interaction with existing bidding system
- [ ] Test trump suit propagation to card comparison methods

### Coverage Targets

- [ ] Maintain 80%+ line coverage for GameManager card play methods
- [ ] Maintain 80%+ branch coverage for validation logic
- [ ] Maintain 80%+ function coverage for new methods

## Definition of Done

- [ ] All card play validation rules implemented
- [ ] Trump suit determination working correctly
- [ ] Game state properly updated after card plays
- [ ] Unit tests written with 80%+ coverage
- [ ] Integration tests pass without regressions
- [ ] TypeScript compilation successful
- [ ] All existing tests continue to pass
- [ ] Manual testing of card play scenarios completed
- [ ] No regressions in bidding system

## Notes

- This story focuses on the mechanics of playing cards, not winning tricks
- Trump suit determination is critical for all subsequent game logic
- Consider edge cases: joker as first card, empty suits in hand
- GameManager events should be emitted for UI updates
