# SB-009: Responsive Mobile Layout

**Epic:** User Interface
**Priority:** Medium
**Story Points:** 5
**Dependencies:** SB-006 (Enhanced Card Interactions)

## User Story

AS A mobile device user
I WANT the game to be fully playable on my phone or tablet
SO THAT I can enjoy Setback anywhere without needing a desktop

## Acceptance Criteria

- [ ] Game is fully playable on mobile devices (iOS/Android)
- [ ] Touch interactions work intuitively for card selection
- [ ] Text and UI elements are appropriately sized for mobile
- [ ] Layout adapts dynamically to different screen orientations
- [ ] Performance remains smooth on mid-range mobile devices
- [ ] All game functionality available on mobile (no desktop-only features)
- [ ] Responsive breakpoints handle various device sizes
- [ ] Touch targets meet accessibility guidelines (44px minimum)

## Technical Details

### Responsive Breakpoints

```typescript
enum ScreenSize {
  MOBILE_PORTRAIT = 'mobile-portrait',    // < 480px width
  MOBILE_LANDSCAPE = 'mobile-landscape',  // 480-768px width, height < width
  TABLET_PORTRAIT = 'tablet-portrait',    // 768-1024px width, height > width
  TABLET_LANDSCAPE = 'tablet-landscape',  // 768-1024px width, height < width
  DESKTOP = 'desktop'                     // > 1024px width
}
```

### Layout Adaptations

1. **Mobile Portrait (Phone)**

   ```text
   ┌─────────────────┐
   │    North AI     │ ← Opponent hand (condensed)
   │ West ♠♠ East   │ ← Side opponents (mini)
   │    ♠ ♠ ♠ ♠     │ ← Trick area (center)
   │                 │
   │ ♠ ♠ ♠ ♠ ♠ ♠   │ ← Player hand (bottom)
   │   [Score Info]  │ ← Collapsed info panel
   └─────────────────┘
   ```

2. **Mobile Landscape (Phone)**

   ```text
   ┌─────────────────────────────┐
   │     North AI     [Scores]   │
   │ West ♠♠ ♠♠♠ ♠♠ East       │
   │ ♠ ♠ ♠ ♠ ♠ ♠ ♠ ♠ ♠ ♠ ♠ ♠ │
   └─────────────────────────────┘
   ```

### Touch Interaction Design

1. **Card Selection**

   ```typescript
   interface TouchInteraction {
     singleTap: () => void;      // Select card
     doubleTap: () => void;      // Play selected card
     longPress: () => void;      // Show card details
     swipeUp: () => void;        // Alternative play action
   }
   ```

2. **Touch Target Sizing**
   - **Card minimum size**: 60x84px (maintains aspect ratio)
   - **Button minimum**: 44x44px
   - **Touch padding**: 8px around interactive elements
   - **Gesture areas**: Extended beyond visual boundaries

### Implementation Approach

1. **Responsive Phaser Configuration**

   ```typescript
   const gameConfig: Phaser.Types.Core.GameConfig = {
     type: Phaser.AUTO,
     scale: {
       mode: Phaser.Scale.RESIZE,
       parent: 'game-container',
       width: '100%',
       height: '100%',
       min: { width: 320, height: 480 },
       max: { width: 1920, height: 1080 }
     }
   };
   ```

2. **Dynamic Layout System**

   ```typescript
   class ResponsiveLayout {
     private screenSize: ScreenSize;
     private orientation: 'portrait' | 'landscape';

     updateLayout(width: number, height: number): void {
       this.detectScreenSize(width, height);
       this.repositionElements();
       this.adjustCardSizes();
       this.updateUIScale();
     }
   }
   ```

3. **Mobile-Specific Features**

   ```typescript
   // Haptic feedback for card selection
   if (this.isMobile && navigator.vibrate) {
     navigator.vibrate(50);
   }

   // Prevent zoom on double-tap
   viewport.addEventListener('dblclick', e => e.preventDefault());

   // Handle device orientation changes
   window.addEventListener('orientationchange', this.handleOrientationChange);
   ```

### Mobile Performance Optimizations

1. **Rendering Optimizations**
   - **Reduce particle effects** on mobile
   - **Lower texture resolution** for background elements
   - **Simplified animations** on older devices
   - **Object pooling** for better memory management

2. **Touch Performance**
   - **Passive event listeners** where appropriate
   - **Debounced touch events** to prevent double-triggers
   - **Touch feedback delays** < 100ms for responsiveness

3. **Memory Management**

   ```typescript
   // Aggressive cleanup on mobile
   if (this.isMobile) {
     this.cleanupUnusedAssets();
     this.limitAudioChannels(2);
     this.reduceParticleCount();
   }
   ```

## Definition of Done

- [ ] Game fully functional on mobile devices
- [ ] Touch interactions are intuitive and responsive
- [ ] Layout adapts properly to all screen sizes and orientations
- [ ] Performance maintains 30fps minimum on mobile
- [ ] All touch targets meet accessibility guidelines
- [ ] Mobile-specific optimizations implemented
- [ ] Comprehensive testing on various mobile devices
- [ ] No mobile-specific bugs or usability issues

## Notes

- **Target devices**: iPhone 8+, Android devices from 2019+
- **Test orientations**: Both portrait and landscape modes
- **Performance priority**: Smooth gameplay over visual effects
- **Touch patterns**: Follow mobile gaming conventions
- **Accessibility**: Support for mobile screen readers
- **Progressive enhancement**: Desktop features remain fully functional
