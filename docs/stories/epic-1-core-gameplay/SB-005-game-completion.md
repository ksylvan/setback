# SB-005: Game Completion and Winner Declaration

**Epic:** Core Gameplay
**Priority:** High
**Story Points:** 2
**Dependencies:** SB-004 (Scoring System)

## User Story

AS A player
I WANT the game to end automatically when a partnership reaches 21 points
SO THAT there is a clear winner and the game concludes properly

## Acceptance Criteria

- [x] Game ends immediately when any partnership reaches 21+ points
- [x] Winning partnership is correctly identified and declared
- [x] Game phase transitions to GAME_OVER
- [x] Final scores are preserved and accessible
- [x] Game over event is emitted with winner information
- [x] No additional hands are dealt after game ends
- [x] Player can start a new game after completion

## Technical Details

### Implementation Approach

```typescript
// Add to GameManager
private checkGameEnd(): boolean {
  return this.gameState.partnerships.some(p => p.score >= this.config.targetScore);
}

private declareWinner(): Partnership {
  return this.gameState.partnerships
    .filter(p => p.score >= this.config.targetScore)
    .sort((a, b) => b.score - a.score)[0]; // Highest score wins
}

private endGame(): void {
  const winner = this.declareWinner();
  this.gameState.winner = winner;
  this.gameState.gamePhase = GamePhase.GAME_OVER;
  this.emit('gameEnded', { winner, finalScores: this.gameState.partnerships });
}
```

### Game End Detection Flow

1. **After Each Hand Scoring** → Check if any partnership >= 21
2. **Multiple Winners** → Highest score wins (rare but possible)
3. **Declare Winner** → Set game state winner
4. **Game Over Phase** → Transition to GAME_OVER
5. **Emit Events** → Notify UI of game completion
6. **Preserve State** → Keep final scores accessible

### Edge Cases to Handle

- **Multiple partnerships reach 21** → Highest score wins
- **Negative scores** → Partnership with negative score can still win if others don't reach 21
- **Exact 21** → 21 points exactly is sufficient to win
- **Mid-hand scoring** → Game only ends after complete hand scoring

## Definition of Done

- [x] Game end detection works correctly after scoring
- [x] Winner determination handles all edge cases
- [x] Game phase transitions to GAME_OVER
- [x] Final game state is preserved
- [x] Appropriate events emitted for UI updates
- [x] Unit tests for winner determination logic
- [x] Integration tests for complete game flow
- [x] Performance: game end detection under 5ms

## Notes

- Game should only end after complete hand scoring, never mid-hand
- Consider implementing "new game" functionality for continuous play
- Final scores should be easily accessible for display/statistics
- Winner determination should be unambiguous and clearly communicated
- This completes the core game loop: Setup → Deal → Bid → Play → Score → End

## Implementation Summary

**Status:** ✅ COMPLETED

### Changes Made

1. **Enhanced GameManager** (`src/managers/GameManager.ts`)
   - Added `declareWinner()` method with proper edge case handling
   - Enhanced `checkGameEnd()` method to use proper winner declaration
   - Added `endGame()` method with comprehensive event emission
   - Modified `completeHand()` to use new game end logic

2. **Updated GameScene UI** (`src/scenes/GameScene.ts`)
   - Added `gameEnded` event handler registration
   - Implemented `onGameEnded()` method for initial game over notification
   - Added complete `showGameOverUI()` method with winner display and new game options

3. **Comprehensive Testing** (`src/managers/GameManager.gameend.test.ts`)
   - 13 unit tests covering all game end scenarios
   - Edge case testing (multiple winners, negative scores, exact target)
   - Event emission verification
   - Performance testing (under 5ms requirement met)
   - Helper function for consistent test setup

### Test Results

- **All 146 tests pass** ✅
- **15 new tests** specifically for SB-005 functionality (refactored from 13 for better maintainability)
- **Performance requirements met** (game end detection < 5ms)
- **Edge cases properly handled**:
  - Multiple partnerships reaching 21+ (highest score wins)
  - Negative scores with other partnerships not reaching target
  - Exact 21 point scenarios
  - Tie scenarios (consistent winner selection)

### Test Coverage Analysis

**Overall Coverage: 99.15%** ✅

| File | % Statements | % Branches | % Functions | % Lines | Uncovered Lines |
|------|-------------|------------|-------------|---------|-----------------|
| **GameManager.ts** | **98.84%** | **96.90%** | **100%** | **98.84%** | 595, 773 |
| Card.ts | 100% | 100% | 100% | 100% | - |
| CardSprite.ts | 100% | 96.42% | 100% | 100% | - |
| CardThemeManager.ts | 100% | 100% | 100% | 100% | - |
| Deck.ts | 100% | 100% | 100% | 100% | - |

**Key Coverage Metrics for SB-005:**

- Game end detection logic: **100% covered**
- Winner declaration methods: **100% covered**
- Edge case handling: **100% covered**
- Performance critical paths: **100% covered**
- Event emission: **100% covered**

**Minor uncovered areas** (2 lines in GameManager.ts):

- Line 595: Error logging in edge case scenario
- Line 773: Debug logging statement

These uncovered lines are non-critical logging statements that don't affect game functionality.

### Key Features Implemented

- Automatic game end detection when partnership reaches 21+ points
- Proper winner declaration with edge case handling
- GAME_OVER phase transition
- Complete game over UI with final scores display
- New Game and Main Menu options
- Preserved final scores for statistics/display
- `gameEnded` event emission with winner and final scores data
