# SB-003: Hand Completion Flow

**Epic:** Core Gameplay
**Priority:** High
**Story Points:** 3
**Dependencies:** SB-002 (Trick-Taking Logic)

## User Story

AS A player
I WANT hands to complete automatically after 6 tricks
SO THAT the game can progress to scoring and the next hand

## Acceptance Criteria

- [ ] Hand automatically ends after 6th trick is completed
- [ ] Game phase transitions from PLAYING to SCORING
- [ ] All trick data is preserved for scoring calculation
- [ ] Game state correctly tracks hand completion
- [ ] Next hand setup is triggered after scoring
- [ ] Dealer rotation works correctly between hands
- [ ] Game ending is detected when partnership reaches 21 points

## Technical Details

### Implementation Approach

1. **Hand Completion Detection**

   ```typescript
   private isHandComplete(): boolean {
     return this.gameState.currentHand.tricks.length === 6;
   }
   ```

2. **Hand Transition Logic**

   ```typescript
   private completeHand(): void {
     this.gameState.gamePhase = GamePhase.SCORING;
     this.emit('handCompleted', this.gameState.currentHand);
     // Trigger scoring phase
     this.scoreHand();
   }
   ```

3. **Key Components**

   ```typescript
   // New methods in GameManager
   private completeHand(): void
   private prepareNextHand(): void
   private rotateDealer(): void
   private checkGameEnd(): boolean
   ```

### Hand Completion Flow

1. **Trick 6 Completed** → Hand completion detected
2. **Transition to Scoring** → Game phase = SCORING
3. **Score Calculation** → Process hand scoring (next story)
4. **Check Game End** → Any partnership >= 21 points?
5. **Next Hand Setup** → Reset hand state, rotate dealer, deal cards
6. **Continue or End** → Start bidding or declare winner

### Dealer Rotation

- Dealer rotates clockwise after each hand
- Track `isDealer` flag on players
- Update dealer before dealing next hand

### Game End Conditions

- Any partnership reaches 21+ points
- Game phase transitions to GAME_OVER
- Winner is declared

## Definition of Done

- [ ] Hand completion automatically detected after 6 tricks
- [ ] Game phase transitions work correctly
- [ ] Dealer rotation implemented and tested
- [ ] Game end detection works when partnership reaches 21
- [ ] Hand reset logic prepares clean state for next hand
- [ ] Unit tests for hand completion scenarios
- [ ] Integration tests for multi-hand game flow

## Notes

- This story sets up the framework for continuous play
- Scoring logic will be implemented in next story (SB-004)
- Need to preserve trick data for scoring before resetting
- Consider edge case: game ending mid-hand (shouldn't happen in Setback)
- Events should be emitted for UI updates at each transition
