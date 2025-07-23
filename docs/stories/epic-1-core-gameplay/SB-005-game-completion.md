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

- [ ] Game ends immediately when any partnership reaches 21+ points
- [ ] Winning partnership is correctly identified and declared
- [ ] Game phase transitions to GAME_OVER
- [ ] Final scores are preserved and accessible
- [ ] Game over event is emitted with winner information
- [ ] No additional hands are dealt after game ends
- [ ] Player can start a new game after completion

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

- [ ] Game end detection works correctly after scoring
- [ ] Winner determination handles all edge cases
- [ ] Game phase transitions to GAME_OVER
- [ ] Final game state is preserved
- [ ] Appropriate events emitted for UI updates
- [ ] Unit tests for winner determination logic
- [ ] Integration tests for complete game flow
- [ ] Performance: game end detection under 5ms

## Notes

- Game should only end after complete hand scoring, never mid-hand
- Consider implementing "new game" functionality for continuous play
- Final scores should be easily accessible for display/statistics
- Winner determination should be unambiguous and clearly communicated
- This completes the core game loop: Setup → Deal → Bid → Play → Score → End
