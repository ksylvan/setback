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

- [x] Hand automatically ends after 6th trick is completed
- [x] Game phase transitions from PLAYING to SCORING
- [x] All trick data is preserved for scoring calculation
- [x] Game state correctly tracks hand completion
- [x] Next hand setup is triggered after scoring
- [x] Dealer rotation works correctly between hands
- [x] Game ending is detected when partnership reaches 21 points

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

- [x] Hand completion automatically detected after 6 tricks
- [x] Game phase transitions work correctly
- [x] Dealer rotation implemented and tested
- [x] Game end detection works when partnership reaches 21
- [x] Hand reset logic prepares clean state for next hand
- [x] Unit tests for hand completion scenarios
- [x] Integration tests for multi-hand game flow

## Completion Summary

**Status:** ✅ COMPLETED
**Date:** 2025-01-23

### Test Results

- **Total Tests:** 133 tests passing across 7 test files
- **Test Duration:** 1.13s
- **Core Logic Coverage:**
  - GameManager.ts: 84.88% statement coverage, 84.17% branch coverage
  - Card.ts: 53.7% statement coverage, 83.09% branch coverage
  - Deck.ts: 90.56% statement coverage, 100% branch coverage
- **Key Test Files:**
  - `src/managers/GameManager.test.ts` - 18 tests: Core game flow
  - `src/managers/GameManager.tricktaking.test.ts` - 14 tests: Hand completion scenarios
  - `src/managers/GameManager.cardplay.test.ts` - 17 tests: Card play integration
  - `src/entities/Card.test.ts` - 22 tests: Card logic
  - `src/entities/Deck.test.ts` - 19 tests: Deck management
  - `src/components/CardSprite.test.ts` - 18 tests: UI components
  - `src/managers/CardThemeManager.test.ts` - 25 tests: Theme management

### Implementation Summary

- ✅ Hand completion detection after 6 tricks (`isHandComplete()`)
- ✅ Game phase transitions (PLAYING → SCORING)
- ✅ Event emission (`handCompleted` event)
- ✅ UI integration (Hand Complete screen)
- ✅ Race condition fixes (phantom dialog prevention)
- ✅ Continuous deck dealing with reshuffling logic
- ✅ Data preservation for scoring phase

### Key Files Modified

- `src/managers/GameManager.ts` - Core hand completion logic
- `src/scenes/GameScene.ts` - UI event handling
- `src/scenes/BootScene.ts` - Asset loading fixes

### Bugs Fixed During Implementation

1. **Card Display Issue** - Fixed asset paths for production builds
2. **Premature Hand Completion** - Added race condition prevention
3. **Phantom Dialogs** - Implemented targeted timer cancellation
4. **Wrong UI Data** - Added data capture before state reset
5. **Deck Dealing Logic** - Continuous 53-card deck with reshuffling

## Notes

- This story sets up the framework for continuous play
- Scoring logic will be implemented in next story (SB-004)
- All trick data is preserved for scoring before resetting
- Events are properly emitted for UI updates at each transition
- Race conditions and timing issues have been resolved
