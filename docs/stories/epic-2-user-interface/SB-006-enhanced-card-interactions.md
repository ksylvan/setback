# SB-006: Enhanced Card Interactions

**Epic:** User Interface
**Priority:** Medium
**Story Points:** 5
**Dependencies:** SB-001 (Card Playing Mechanics)

## User Story

AS A player
I WANT intuitive and responsive card interaction controls
SO THAT I can easily select and play cards without confusion

## Acceptance Criteria

- [ ] Cards in hand are clearly visible and distinguishable
- [ ] Playable cards are highlighted, unplayable cards are dimmed
- [ ] Card selection provides immediate visual feedback
- [ ] Hover effects show card details and playability status
- [ ] Click/tap to select, confirm to play interaction pattern
- [ ] Keyboard navigation support for accessibility
- [ ] Clear indication of which player's turn it is

## Technical Details

### Implementation Approach

1. **Card Visual States**

   ```typescript
   interface CardDisplayState {
     playable: boolean;
     selected: boolean;
     highlighted: boolean;
     dimmed: boolean;
   }
   ```

2. **Interaction Flow**
   - **Hover/Focus** → Show card details tooltip
   - **Click** → Select card (visual highlight)
   - **Confirm Button** → Play selected card
   - **Right Click/Escape** → Deselect card

3. **Visual Feedback System**

   ```typescript
   // In GameScene
   private updateCardDisplayStates(): void {
     this.playerCards.forEach(cardSprite => {
       const isPlayable = this.isCardPlayable(cardSprite.cardData);
       cardSprite.setPlayable(isPlayable);
     });
   }
   ```

### Card Interaction Features

1. **Playability Indication**
   - **Green border**: Card can be played
   - **Red tint**: Card cannot be played (must follow suit)
   - **Tooltip**: Explains why card is/isn't playable

2. **Selection Feedback**
   - **Raised position**: Selected card moves up slightly
   - **Glow effect**: Selected card has subtle glow
   - **Confirm button**: Appears when card is selected

3. **Turn Indication**
   - **Player name highlight**: Current player's name glows
   - **Timer indicator**: Optional turn timer display
   - **Instruction text**: "Your turn to play" / "Waiting for [Player]"

### Keyboard Navigation

- **Arrow keys**: Navigate between playable cards
- **Enter/Space**: Select highlighted card
- **Tab**: Cycle through interactive elements
- **Escape**: Deselect current selection

## Definition of Done

- [ ] All card interaction states implemented
- [ ] Hover effects and tooltips working
- [ ] Click-to-select, confirm-to-play pattern implemented
- [ ] Keyboard navigation fully functional
- [ ] Visual feedback is clear and immediate
- [ ] Touch/mobile interactions work properly
- [ ] No performance issues with card animations
- [ ] Accessibility compliance (screen reader support)

## Notes

- Build on existing Phaser 3 GameScene structure
- Consider mobile touch patterns (tap vs hover)
- Ensure consistent visual language across all UI elements
- Card selection should be forgiving (easy to change mind)
- Visual feedback should be immediate (< 50ms response time)
