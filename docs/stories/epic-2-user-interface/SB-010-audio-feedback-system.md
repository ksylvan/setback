# SB-010: Audio Feedback System

**Epic:** User Interface
**Priority:** Low
**Story Points:** 3
**Dependencies:** SB-008 (Card Animation System)

## User Story

AS A player
I WANT audio feedback for game actions and events
SO THAT the game feels more engaging and provides additional sensory cues

## Acceptance Criteria

- [ ] Card sounds for dealing, playing, and collecting
- [ ] UI sounds for bidding actions and button clicks
- [ ] Ambient sounds for game atmosphere (optional)
- [ ] Audio settings for volume control and mute
- [ ] Sounds synchronized with animations and actions
- [ ] Audio works on both desktop and mobile devices
- [ ] No audio delays or performance impact
- [ ] Accessible audio cues for screen reader users

## Technical Details

### Sound Categories

1. **Card Sounds**

   ```typescript
   interface CardSounds {
     deal: string;           // Cards being dealt
     play: string;           // Card played to trick
     collect: string;        // Trick collected
     shuffle: string;        // Deck shuffle (hand start)
     flip: string;           // Card selection/hover
   }
   ```

2. **UI Sounds**

   ```typescript
   interface UISounds {
     bid: string;            // Bid placed
     pass: string;           // Player passes
     buttonClick: string;    // General button interaction
     error: string;          // Invalid action attempt
     gameStart: string;      // New game begins
     gameEnd: string;        // Game completion
   }
   ```

3. **Atmospheric Sounds**

   ```typescript
   interface AmbientSounds {
     background?: string;    // Subtle card room ambience
     trump?: string;         // Trump suit established
     winning?: string;       // Hand/game won
   }
   ```

### Implementation Approach

1. **Audio Manager**

   ```typescript
   class AudioManager {
     private sounds: Map<string, Phaser.Sound.BaseSound>;
     private settings: AudioSettings;

     async loadSounds(): Promise<void>
     play(soundKey: string, volume?: number): void
     setMasterVolume(volume: number): void
     mute(muted: boolean): void
   }
   ```

2. **Audio Settings**

   ```typescript
   interface AudioSettings {
     masterVolume: number;   // 0.0 - 1.0
     sfxVolume: number;      // 0.0 - 1.0
     musicVolume: number;    // 0.0 - 1.0 (future)
     muted: boolean;
     reducedMotion: boolean; // Accessibility setting
   }
   ```

3. **Event Integration**

   ```typescript
   // Synchronized with game events
   gameManager.on('cardPlayed', () => audioManager.play('cardPlay'));
   gameManager.on('bidPlaced', () => audioManager.play('bid'));
   gameManager.on('trickWon', () => audioManager.play('trickCollect'));
   ```

### Audio Asset Specifications

1. **File Format Requirements**
   - **Primary**: WebM (Opus) for modern browsers
   - **Fallback**: MP3 for compatibility
   - **Mobile**: Compressed formats for bandwidth efficiency

2. **Audio Characteristics**

   ```typescript
   interface AudioSpec {
     duration: number;       // < 2 seconds for most SFX
     sampleRate: 44100;      // CD quality
     bitRate: 128;           // kb/sec for MP3
     channels: 1;            // Mono for SFX (stereo for music)
     format: 'webm' | 'mp3'; // Progressive enhancement
   }
   ```

3. **Sound Design Guidelines**
   - **Card sounds**: Realistic paper/cardboard texture
   - **UI sounds**: Subtle, not intrusive
   - **Volume levels**: Consistent across all sounds
   - **Frequency range**: Avoid harsh highs or booming lows

### Mobile Audio Considerations

1. **iOS Web Audio Limitations**

   ```typescript
   // Require user interaction before audio
   private async enableAudioOnIOS(): Promise<void> {
     if (this.isIOS && !this.audioUnlocked) {
       await this.playEmptySound(); // Unlock audio context
       this.audioUnlocked = true;
     }
   }
   ```

2. **Performance Optimizations**

   ```typescript
   // Preload critical sounds only
   const criticalSounds = ['cardPlay', 'bid', 'buttonClick'];

   // Lazy load atmospheric sounds
   if (!this.isMobile) {
     this.loadAmbientSounds();
   }
   ```

### Accessibility Features

1. **Audio Cues for Screen Readers**

   ```typescript
   interface A11ySounds {
     cardPlayable: string;    // Card can be played
     cardSelected: string;    // Card selected
     yourTurn: string;        // Player's turn indicator
     scoreUpdate: string;     // Score change notification
   }
   ```

2. **Reduced Motion Support**

   ```typescript
   // Respect user preferences
   if (this.settings.reducedMotion) {
     this.disableAnimationSounds();
     this.enableDescriptiveSounds();
   }
   ```

## Definition of Done

- [ ] All core game actions have appropriate sound effects
- [ ] Audio settings panel with volume controls implemented
- [ ] Sounds synchronized properly with game events
- [ ] Mobile audio functionality working correctly
- [ ] Audio performance has no impact on gameplay framerate
- [ ] Accessibility features implemented for audio cues
- [ ] Audio assets optimized for web delivery
- [ ] Comprehensive testing across devices and browsers

## Notes

- **Audio priorities**: Card sounds > UI sounds > Ambient sounds
- **Performance budget**: < 2MB total audio assets
- **User control**: Easy to mute/adjust without disrupting gameplay
- **Progressive enhancement**: Game fully functional without audio
- **Legal considerations**: Ensure all audio assets are properly licensed
- **Future extensibility**: Design system to support music and more complex audio
