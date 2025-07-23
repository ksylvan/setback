# SB-008: Card Animation System

**Epic:** User Interface
**Priority:** Medium
**Story Points:** 5
**Dependencies:** SB-002 (Trick-Taking Logic)

## User Story

AS A player
I WANT smooth animations when cards are dealt, played, and collected
SO THAT the game feels polished and enjoyable to watch

## Acceptance Criteria

- [ ] Cards animate smoothly when dealt to players
- [ ] Card plays animate from hand to trick area
- [ ] Trick collection animates cards to winner
- [ ] Animations maintain 60fps performance
- [ ] Animation timing feels natural and not too slow/fast
- [ ] Animations can be skipped or sped up for faster play
- [ ] No animation conflicts or visual glitches
- [ ] Animations work properly on mobile devices

## Technical Details

### Animation Types

1. **Deal Animation**

   ```typescript
   private animateCardDeal(targetPlayer: PlayerPosition, card: Card): Promise<void> {
     // Cards fly from deck to player position
     // Stagger timing for realistic dealing
     // Duration: ~200ms per card
   }
   ```

2. **Card Play Animation**

   ```typescript
   private animateCardPlay(from: PlayerPosition, card: Card): Promise<void> {
     // Card moves from hand to center trick area
     // Smooth arc trajectory
     // Duration: ~400ms
   }
   ```

3. **Trick Collection Animation**

   ```typescript
   private animateCardCollection(winner: PlayerPosition, cards: Card[]): Promise<void> {
     // All trick cards move to winner's trick pile
     // Slight stagger for visual appeal
     // Duration: ~500ms
   }
   ```

### Implementation Approach

1. **Phaser 3 Tweens**

   ```typescript
   // Use Phaser's built-in tween system
   this.scene.tweens.add({
     targets: cardSprite,
     x: targetX,
     y: targetY,
     rotation: targetRotation,
     duration: 400,
     ease: 'Power2',
     onComplete: () => resolveAnimation()
   });
   ```

2. **Animation Queue System**

   ```typescript
   class AnimationQueue {
     private queue: (() => Promise<void>)[] = [];
     private running: boolean = false;

     async add(animation: () => Promise<void>): Promise<void>
     private async processQueue(): Promise<void>
   }
   ```

3. **Performance Optimization**

   ```typescript
   // Object pooling for card sprites
   // Reuse sprites instead of creating/destroying
   // Batch similar animations together
   // Skip animations on mobile if performance issues
   ```

### Animation Settings

1. **Timing Configuration**

   ```typescript
   interface AnimationConfig {
     dealDuration: number;      // 200ms default
     playDuration: number;      // 400ms default
     collectDuration: number;   // 500ms default
     staggerDelay: number;      // 50ms between cards
     skipAnimations: boolean;   // User preference
   }
   ```

2. **Easing and Motion**
   - **Deal**: Linear with slight acceleration
   - **Play**: Smooth arc with Power2 easing
   - **Collect**: Gentle ease-in-out
   - **Rotation**: Cards rotate slightly during flight

3. **Visual Polish**

   ```typescript
   // Card shadows during animation
   // Slight scale changes for emphasis
   // Sound effects synchronized with animations
   // Particle effects for special cards (joker)
   ```

### Performance Considerations

1. **Frame Rate Targets**
   - **Desktop**: 60fps maintained during all animations
   - **Mobile**: 30fps minimum, 60fps preferred
   - **Fallback**: Disable animations if performance drops

2. **Optimization Techniques**
   - **Sprite pooling**: Reuse card sprites
   - **Batch updates**: Group similar animations
   - **GPU acceleration**: Use transform3d for smooth movement
   - **Memory management**: Clean up completed animations

## Definition of Done

- [ ] All card animation types implemented and smooth
- [ ] Animation system maintains target frame rates
- [ ] User preferences for animation speed/disable
- [ ] No visual glitches or timing conflicts
- [ ] Mobile performance meets requirements
- [ ] Animation queue prevents overlapping issues
- [ ] Memory usage stays within bounds during animations
- [ ] Comprehensive testing on various devices

## Notes

- Animations should enhance gameplay, not slow it down
- Consider "fast mode" for experienced players
- Ensure animations are interruptible for responsive gameplay
- Test with rapid card play scenarios
- Animation timing should match real card game feel
- Consider accessibility needs (motion sensitivity)
