import type { Card } from "@/entities/Card";
import { Rank, Suit } from "@/types/game";
import type { CardDisplayState } from "@/types/interaction";
import { isMobile, isTablet } from "@/utils/ResponsiveUtils";
import {
  type DoubleTapData,
  type LongPressData,
  type SwipeData,
  TouchGestureManager,
} from "@/utils/TouchGestureManager";
import { CardTooltip } from "./CardTooltip";

/**
 * CardTheme interface for skinnable card appearances
 */
export interface CardTheme {
  id: string;
  name: string;
  cardBack: string;
  cardWidth: number;
  cardHeight: number;
  suits: {
    [Suit.HEARTS]: string;
    [Suit.DIAMONDS]: string;
    [Suit.CLUBS]: string;
    [Suit.SPADES]: string;
  };
  colors: {
    red: number;
    black: number;
    background: number;
    border: number;
    highlight: number;
    disabled: number;
  };
}

/**
 * CardSprite - Beautiful, interactive card rendering with Phaser 3
 */
export class CardSprite extends Phaser.GameObjects.Container {
  private card: Card;
  private theme: CardTheme;
  private cardBack!: Phaser.GameObjects.Image;
  private cardFace!: Phaser.GameObjects.Image;
  private highlight!: Phaser.GameObjects.Rectangle;
  private playabilityBorder!: Phaser.GameObjects.Rectangle;
  private selectionIndicator!: Phaser.GameObjects.Rectangle;
  private focusIndicator!: Phaser.GameObjects.Rectangle;
  private isRevealed: boolean = true;
  private isSelectable: boolean = true;
  private isSelected: boolean = false;
  private isHovered: boolean = false;
  private isFocused: boolean = false;
  private displayState: CardDisplayState;
  private tooltip?: CardTooltip;
  private tooltipTimer?: Phaser.Time.TimerEvent;

  // Touch gesture management
  private touchGestureManager?: TouchGestureManager;
  private mobileOptimized: boolean = false;

  // Animation properties
  private originalScale: number = 1;
  private hoverScale: number = 1.05;
  private selectedScale: number = 1.1;
  private animationDuration: number = 150;

  constructor(scene: Phaser.Scene, x: number, y: number, card: Card, theme: CardTheme) {
    super(scene, x, y);

    this.card = card;
    this.theme = theme;
    this.originalScale = 1;

    // Initialize display state
    this.displayState = {
      playable: true,
      selected: false,
      highlighted: false,
      dimmed: false,
    };

    this.createCardComponents();
    this.setupInteractivity();
    this.setupAccessibility();
    this.updateDisplay();

    // Enable mobile optimizations on touch devices
    this.mobileOptimized = isMobile() || isTablet();
    if (this.mobileOptimized) {
      this.setupMobileTouchGestures();
    }

    scene.add.existing(this);
  }

  /**
   * Create the visual components of the card
   */
  private createCardComponents(): void {
    const { cardWidth, cardHeight, colors } = this.theme;

    // Focus indicator (for keyboard navigation)
    this.focusIndicator = this.scene.add.rectangle(0, 0, cardWidth + 8, cardHeight + 8, 0x4a90e2, 0);
    this.focusIndicator.setStrokeStyle(3, 0x4a90e2);
    this.add(this.focusIndicator);

    // Playability border (green for playable, red for unplayable)
    this.playabilityBorder = this.scene.add.rectangle(0, 0, cardWidth + 4, cardHeight + 4, 0x4caf50, 0);
    this.playabilityBorder.setStrokeStyle(2, 0x4caf50);
    this.add(this.playabilityBorder);

    // Selection indicator (moves card up and adds glow)
    this.selectionIndicator = this.scene.add.rectangle(0, 0, cardWidth + 6, cardHeight + 6, 0xffd700, 0);
    this.selectionIndicator.setStrokeStyle(3, 0xffd700);
    this.add(this.selectionIndicator);

    // Highlight overlay (initially invisible)
    this.highlight = this.scene.add.rectangle(0, 0, cardWidth, cardHeight, colors.highlight, 0);
    this.add(this.highlight);

    // Card back (for face-down cards)
    const cardBackTexture = this.getCardBackTexture();
    this.cardBack = this.scene.add.image(0, 0, cardBackTexture);
    this.cardBack.setDisplaySize(cardWidth, cardHeight);
    this.cardBack.setVisible(false);
    this.add(this.cardBack);

    // Card face (for face-up cards) - use real card images
    const cardFaceTexture = this.getCardFaceTexture();
    this.cardFace = this.scene.add.image(0, 0, cardFaceTexture);
    this.cardFace.setDisplaySize(cardWidth, cardHeight);
    this.cardFace.setVisible(true);
    this.add(this.cardFace);

    // Apply theme-specific visual effects
    this.applyThemeEffects();
  }

  /**
   * Get the texture key for the card back based on theme
   */
  private getCardBackTexture(): string {
    // Use the card back specified in the theme
    return this.theme.cardBack;
  }

  /**
   * Get the texture key for the card face
   */
  private getCardFaceTexture(): string {
    if (this.card.isJoker) {
      return "card_joker_red";
    }

    const suit = this.card.suit?.toLowerCase();
    const rank = this.getRankDisplay();
    const textureKey = `card_${suit}_${rank}`;

    console.log(`🎴 CardSprite: Getting texture for ${this.card.displayName}`);
    console.log(`🎴 Suit: ${suit}, Rank: ${rank}, TextureKey: ${textureKey}`);
    console.log(`🎴 Texture exists:`, this.scene.textures.exists(textureKey));

    return textureKey;
  }

  /**
   * Setup interactive behavior
   */
  private setupInteractivity(): void {
    this.setSize(this.theme.cardWidth, this.theme.cardHeight);
    this.setInteractive();

    // Desktop interaction (mouse-based)
    if (!this.mobileOptimized) {
      // Hover effects with tooltip
      this.on("pointerover", (pointer: Phaser.Input.Pointer) => this.onHover(true, pointer));
      this.on("pointerout", () => this.onHover(false));

      // Click handling for desktop
      this.on("pointerdown", () => this.onSelect());

      // Add cursor change on hover
      this.on("pointerover", () => {
        if (this.isSelectable) {
          this.scene.input.setDefaultCursor("pointer");
        }
      });

      this.on("pointerout", () => {
        this.scene.input.setDefaultCursor("default");
      });
    } else {
      // Basic tap handling for mobile (enhanced gestures handled separately)
      this.on("pointerdown", () => {
        // Note: Enhanced touch gestures are handled by TouchGestureManager
      });
    }
  }

  /**
   * Setup mobile touch gesture handling
   */
  private setupMobileTouchGestures(): void {
    // Initialize touch gesture manager with card-optimized settings
    this.touchGestureManager = new TouchGestureManager(this.scene, this, {
      // Swipe gestures for quick actions
      swipeMinDistance: 40,
      swipeMaxTime: 250,
      swipeMinVelocity: 0.15,

      // Double-tap for confirmation
      doubleTapMaxDelay: 400,
      doubleTapMaxDistance: 25,

      // Long press for context info
      longPressDelay: 700,
      longPressMaxMovement: 15,

      // Enable pressure sensitivity if available
      pressureSensitive: TouchGestureManager.supportsPressure(),
      minimumPressure: 0.3,
    });

    // Handle touch gestures
    this.touchGestureManager.on("tap", this.onMobileTap, this);
    this.touchGestureManager.on("doubletap", this.onMobileDoubleTap, this);
    this.touchGestureManager.on("longpress", this.onMobileLongPress, this);
    this.touchGestureManager.on("swipeup", this.onMobileSwipeUp, this);
    this.touchGestureManager.on("swipedown", this.onMobileSwipeDown, this);
    this.touchGestureManager.on("swipeleft", this.onMobileSwipeLeft, this);
    this.touchGestureManager.on("swiperight", this.onMobileSwipeRight, this);
  }

  /**
   * Handle mobile tap gesture
   */
  private onMobileTap(): void {
    if (!this.isSelectable) return;

    // Show brief selection feedback
    this.showMobileTapFeedback();

    // Emit selection event
    this.onSelect();
  }

  /**
   * Handle mobile double-tap gesture (confirm action)
   */
  private onMobileDoubleTap(_data: DoubleTapData): void {
    if (!this.isSelectable) return;

    // Double-tap always confirms if card is selected
    if (this.isSelected) {
      this.emit("cardConfirmed", {
        card: this.card,
        action: "confirm",
        playable: this.displayState.playable,
        sprite: this,
        gestureType: "doubletap",
      });
    } else {
      // Select and immediately confirm
      this.isSelected = true;
      this.displayState.selected = true;
      this.updateVisualState();

      this.emit("cardConfirmed", {
        card: this.card,
        action: "confirm",
        playable: this.displayState.playable,
        sprite: this,
        gestureType: "doubletap",
      });
    }

    // Show double-tap feedback
    this.showMobileDoubleTapFeedback();
  }

  /**
   * Handle mobile long press gesture (show context info)
   */
  private onMobileLongPress(data: LongPressData): void {
    if (!this.isSelectable) return;

    // Show tooltip with enhanced positioning for mobile
    this.showTooltip(data.x, data.y, true);

    // Provide haptic feedback if available
    this.provideMobileHapticFeedback("light");

    // Emit long press event with pressure data
    this.emit("cardLongPress", {
      card: this.card,
      playable: this.displayState.playable,
      reason: this.displayState.reason,
      sprite: this,
      pressure: data.pressure,
      gestureType: "longpress",
    });
  }

  /**
   * Handle swipe up gesture (quick play if selected)
   */
  private onMobileSwipeUp(data: SwipeData): void {
    if (!this.isSelectable || !this.isSelected) return;

    // Swipe up to quickly confirm selected card
    this.emit("cardConfirmed", {
      card: this.card,
      action: "confirm",
      playable: this.displayState.playable,
      sprite: this,
      gestureType: "swipeup",
      velocity: data.velocity,
    });

    this.showMobileSwipeFeedback("up");
  }

  /**
   * Handle swipe down gesture (cancel selection)
   */
  private onMobileSwipeDown(data: SwipeData): void {
    if (!this.isSelectable || !this.isSelected) return;

    // Swipe down to cancel selection
    this.isSelected = false;
    this.displayState.selected = false;
    this.updateVisualState();

    this.emit("cardCancelled", {
      card: this.card,
      action: "cancel",
      sprite: this,
      gestureType: "swipedown",
      velocity: data.velocity,
    });

    this.showMobileSwipeFeedback("down");
  }

  /**
   * Handle swipe left gesture (additional context action)
   */
  private onMobileSwipeLeft(data: SwipeData): void {
    if (!this.isSelectable) return;

    // Show card details or alternate action
    this.emit("cardSwipeLeft", {
      card: this.card,
      sprite: this,
      velocity: data.velocity,
    });

    this.showMobileSwipeFeedback("left");
  }

  /**
   * Handle swipe right gesture (additional context action)
   */
  private onMobileSwipeRight(data: SwipeData): void {
    if (!this.isSelectable) return;

    // Show card details or alternate action
    this.emit("cardSwipeRight", {
      card: this.card,
      sprite: this,
      velocity: data.velocity,
    });

    this.showMobileSwipeFeedback("right");
  }

  /**
   * Show visual feedback for mobile tap
   */
  private showMobileTapFeedback(): void {
    if (!this.scene || !this.scene.tweens) return;

    // Brief scale pulse
    this.scene.tweens.add({
      targets: this,
      scaleX: this.originalScale * 0.95,
      scaleY: this.originalScale * 0.95,
      duration: 80,
      ease: "Power2.easeOut",
      yoyo: true,
    });

    // Brief highlight flash
    this.scene.tweens.add({
      targets: this.highlight,
      alpha: 0.6,
      duration: 100,
      ease: "Power2.easeOut",
      yoyo: true,
    });
  }

  /**
   * Show visual feedback for mobile double-tap
   */
  private showMobileDoubleTapFeedback(): void {
    if (!this.scene || !this.scene.tweens) return;

    // More pronounced scale effect
    this.scene.tweens.add({
      targets: this,
      scaleX: this.selectedScale * 1.1,
      scaleY: this.selectedScale * 1.1,
      duration: 150,
      ease: "Back.easeOut",
      yoyo: true,
    });

    // Golden flash for confirmation
    const flash = this.scene.add.rectangle(0, 0, this.theme.cardWidth + 20, this.theme.cardHeight + 20, 0xffd700, 0.8);
    this.add(flash);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      ease: "Power2.easeOut",
      onComplete: () => {
        flash.destroy();
      },
    });
  }

  /**
   * Show visual feedback for swipe gestures
   */
  private showMobileSwipeFeedback(direction: "up" | "down" | "left" | "right"): void {
    if (!this.scene || !this.scene.tweens) return;

    // Direction-based color coding
    const colors = {
      up: 0x4caf50, // Green (confirm)
      down: 0xf44336, // Red (cancel)
      left: 0x2196f3, // Blue (info)
      right: 0xff9800, // Orange (alternate)
    };

    const arrow = this.scene.add.text(0, 0, this.getSwipeArrow(direction), {
      fontSize: "32px",
      color: `#${colors[direction].toString(16).padStart(6, "0")}`,
    });
    arrow.setOrigin(0.5);
    this.add(arrow);

    // Animate arrow
    this.scene.tweens.add({
      targets: arrow,
      alpha: 0,
      y: direction === "up" ? -30 : direction === "down" ? 30 : 0,
      x: direction === "left" ? -30 : direction === "right" ? 30 : 0,
      duration: 400,
      ease: "Power2.easeOut",
      onComplete: () => {
        arrow.destroy();
      },
    });
  }

  /**
   * Get appropriate arrow emoji for swipe direction
   */
  private getSwipeArrow(direction: string): string {
    const arrows = {
      up: "↑",
      down: "↓",
      left: "←",
      right: "→",
    };
    return arrows[direction as keyof typeof arrows] || "•";
  }

  /**
   * Provide haptic feedback on supported devices
   */
  private provideMobileHapticFeedback(type: "light" | "medium" | "heavy" = "light"): void {
    if ("vibrate" in navigator) {
      const patterns = {
        light: [50],
        medium: [100],
        heavy: [200],
      };
      navigator.vibrate(patterns[type]);
    }
  }

  /**
   * Handle hover state changes with tooltip
   */
  private onHover(isHovering: boolean, pointer?: Phaser.Input.Pointer): void {
    if (!this.isSelectable) return;

    this.isHovered = isHovering;

    if (isHovering && pointer) {
      // Show tooltip after delay
      this.tooltipTimer = this.scene.time.delayedCall(300, () => {
        this.showTooltip(pointer.worldX, pointer.worldY);
      });

      // Emit hover start event
      this.emit("cardHoverStart", { card: this.card, playable: this.displayState.playable });
    } else {
      // Hide tooltip immediately
      this.hideTooltip();

      // Cancel tooltip timer
      if (this.tooltipTimer) {
        this.tooltipTimer.remove();
        this.tooltipTimer = undefined;
      }

      // Emit hover end event
      this.emit("cardHoverEnd", { card: this.card });
    }

    this.updateVisualState();
  }

  /**
   * Handle selection with confirm-to-play pattern
   */
  private onSelect(): void {
    if (!this.isSelectable) return;

    // Hide tooltip on selection
    this.hideTooltip();

    const wasSelected = this.isSelected;
    this.isSelected = !this.isSelected;
    this.displayState.selected = this.isSelected;
    this.updateVisualState();

    // Emit appropriate event based on selection state
    if (this.isSelected && !wasSelected) {
      this.emit("cardSelected", {
        card: this.card,
        action: "select",
        playable: this.displayState.playable,
        reason: this.displayState.reason,
        sprite: this,
      });
    } else if (!this.isSelected && wasSelected) {
      this.emit("cardCancelled", {
        card: this.card,
        action: "cancel",
        sprite: this,
      });
    } else if (this.isSelected && wasSelected) {
      // Double-click/tap to confirm
      this.emit("cardConfirmed", {
        card: this.card,
        action: "confirm",
        playable: this.displayState.playable,
        sprite: this,
      });
    }
  }

  /**
   * Update visual state based on display state and interactions
   */
  private updateVisualState(): void {
    // Safety check: ensure scene is still valid
    if (!this.scene || !this.scene.tweens) {
      return;
    }

    // Cancel any existing animations
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.highlight);
    this.scene.tweens.killTweensOf(this.playabilityBorder);
    this.scene.tweens.killTweensOf(this.selectionIndicator);
    this.scene.tweens.killTweensOf(this.focusIndicator);

    let targetScale = this.originalScale;
    let targetY = 0;
    let highlightAlpha = 0;
    let playabilityAlpha = 0;
    let selectionAlpha = 0;
    let focusAlpha = 0;
    let cardAlpha = 1;

    // Apply visual feedback based on state
    if (this.displayState.dimmed) {
      cardAlpha = 0.6;
      playabilityAlpha = 0.8;
      this.playabilityBorder.setStrokeStyle(2, 0xf44336); // Red for unplayable
    } else if (this.displayState.playable) {
      playabilityAlpha = this.isHovered ? 0.6 : 0.3;
      this.playabilityBorder.setStrokeStyle(2, 0x4caf50); // Green for playable
    }

    if (this.isSelected) {
      targetScale = this.selectedScale;
      targetY = -10; // Move card up when selected
      selectionAlpha = 0.8;
      highlightAlpha = 0.2;
    } else if (this.isHovered) {
      targetScale = this.hoverScale;
      highlightAlpha = 0.15;
    }

    if (this.isFocused) {
      focusAlpha = 0.7;
    }

    // Smooth animations with staggered timing for better visual feedback
    // Additional safety check before creating animations
    if (!this.scene || !this.scene.tweens) {
      return;
    }

    this.scene.tweens.add({
      targets: this,
      scaleX: targetScale,
      scaleY: targetScale,
      y: this.y + targetY,
      duration: this.animationDuration,
      ease: "Back.easeOut",
    });

    // Highlight animation
    this.scene.tweens.add({
      targets: this.highlight,
      alpha: highlightAlpha,
      duration: this.animationDuration,
      ease: "Power2",
    });

    // Playability border animation
    this.scene.tweens.add({
      targets: this.playabilityBorder,
      alpha: playabilityAlpha,
      duration: this.animationDuration,
      ease: "Power2",
    });

    // Selection indicator animation
    this.scene.tweens.add({
      targets: this.selectionIndicator,
      alpha: selectionAlpha,
      duration: this.animationDuration,
      ease: "Power2",
    });

    // Focus indicator animation
    this.scene.tweens.add({
      targets: this.focusIndicator,
      alpha: focusAlpha,
      duration: this.animationDuration,
      ease: "Power2",
    });

    // Card face alpha for dimming effect
    this.scene.tweens.add({
      targets: [this.cardFace, this.cardBack],
      alpha: cardAlpha,
      duration: this.animationDuration,
      ease: "Power2",
    });
  }

  /**
   * Utility methods
   */
  private getRankDisplay(): string {
    switch (this.card.rank) {
      case Rank.ACE:
        return "A";
      case Rank.JACK:
        return "J";
      case Rank.QUEEN:
        return "Q";
      case Rank.KING:
        return "K";
      default:
        // For numbered cards (2-10), use zero-padded format like "02", "03", etc.
        return this.card.rank.toString().padStart(2, "0");
    }
  }

  /**
   * Apply theme-specific visual effects
   */
  private applyThemeEffects(): void {
    // Apply theme-based tinting and effects
    switch (this.theme.id) {
      case "neon":
        // Neon glow effect with slight pink tint
        this.cardFace.setTint(0xffe0ff);
        this.cardBack.setTint(0xffe0ff);
        break;
      case "vintage":
        // Sepia tone effect for old-world charm
        this.cardFace.setTint(0xf5deb3);
        this.cardBack.setTint(0xf5deb3);
        break;
      case "modern":
        // Clean, bright appearance with slight blue tint
        this.cardFace.setTint(0xf8f8ff);
        this.cardBack.setTint(0xf8f8ff);
        break;
      case "high_contrast":
        // Pure white for maximum contrast
        this.cardFace.setTint(0xffffff);
        this.cardBack.setTint(0xffffff);
        break;
      default: // classic
        // Natural card appearance with very slight warm tint
        this.cardFace.setTint(0xfffaf0);
        this.cardBack.setTint(0xfffaf0);
        break;
    }
  }

  /**
   * Public API methods
   */
  public getCard(): Card {
    return this.card;
  }

  public setSelectable(selectable: boolean): void {
    this.isSelectable = selectable;
    this.setInteractive(selectable);

    if (!selectable) {
      this.isSelected = false;
      this.isHovered = false;
      this.updateVisualState();
    }
  }

  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.displayState.selected = selected;
    this.updateVisualState();
  }

  /**
   * Set the display state for the card
   */
  public setDisplayState(state: CardDisplayState): void {
    this.displayState = { ...state };
    this.isSelected = state.selected;
    this.updateVisualState();
  }

  /**
   * Set playability with enhanced visual feedback
   */
  public setPlayable(playable: boolean, reason?: string): void {
    this.displayState.playable = playable;
    this.displayState.dimmed = !playable;
    this.displayState.reason = reason;
    this.updateVisualState();
  }

  /**
   * Set keyboard focus state
   */
  public setFocused(focused: boolean): void {
    this.isFocused = focused;
    this.updateVisualState();

    if (focused) {
      this.emit("cardFocused", { card: this.card, sprite: this });
    }
  }

  /**
   * Show tooltip at specified position
   */
  public showTooltip(x: number, y: number, isMobileContext = false): void {
    // Safety check: ensure scene is available before creating tooltip
    if (!this.scene) {
      console.warn("CardSprite: No scene available for tooltip");
      return;
    }

    if (this.tooltip) {
      this.hideTooltip();
    }

    this.tooltip = CardTooltip.getFromPool(this.scene);

    // Emit event to request fresh playability status for tooltip
    // This ensures tooltip always shows current game state, not cached state
    this.emit("tooltipRequested", {
      card: this.card,
      x,
      y,
      tooltip: this.tooltip,
      sprite: this,
      isMobileContext,
    });
  }

  /**
   * Hide tooltip
   */
  public hideTooltip(): void {
    if (this.tooltip) {
      this.tooltip.hide();
      this.tooltip = undefined;
    }
  }

  /**
   * Setup accessibility attributes
   */
  private setupAccessibility(): void {
    // Set ARIA attributes for screen readers
    this.setData("role", "button");
    this.setData("tabindex", this.isSelectable ? "0" : "-1");
    this.updateAccessibilityLabel();
  }

  /**
   * Update accessibility label based on current state
   */
  private updateAccessibilityLabel(): void {
    let label = `Card ${this.card.displayName}. `;

    if (this.displayState.playable) {
      label += "Playable. ";
    } else {
      label += "Cannot play. ";
      if (this.displayState.reason) {
        label += `${this.displayState.reason}. `;
      }
    }

    if (this.isSelected) {
      label += "Selected. Press Enter to confirm or Escape to cancel.";
    } else {
      label += "Press Enter to select.";
    }

    this.setData("aria-label", label);
  }

  /**
   * Get current display state
   */
  public getDisplayState(): CardDisplayState {
    return { ...this.displayState };
  }

  public setRevealed(revealed: boolean): void {
    this.isRevealed = revealed;
    this.updateDisplay();
  }

  public setTheme(theme: CardTheme): void {
    this.theme = theme;

    // Update card back texture based on new theme
    const newCardBackTexture = this.getCardBackTexture();
    this.cardBack.setTexture(newCardBackTexture);
    this.cardBack.setDisplaySize(theme.cardWidth, theme.cardHeight);

    // Update card face size
    this.cardFace.setDisplaySize(theme.cardWidth, theme.cardHeight);

    // Update highlight size and color
    this.highlight.width = theme.cardWidth;
    this.highlight.height = theme.cardHeight;
    this.highlight.fillColor = theme.colors.highlight;

    // Apply new theme effects
    this.applyThemeEffects();

    this.updateDisplay();
  }

  private updateDisplay(): void {
    this.cardBack.setVisible(!this.isRevealed);
    this.cardFace.setVisible(this.isRevealed);
  }

  public playFlipAnimation(duration: number = 300): Promise<void> {
    return new Promise((resolve) => {
      if (!this.scene || !this.scene.tweens) {
        resolve();
        return;
      }

      this.scene.tweens.add({
        targets: this,
        scaleX: 0,
        duration: duration / 2,
        ease: "Power2",
        onComplete: () => {
          this.isRevealed = !this.isRevealed;
          this.updateDisplay();

          if (!this.scene || !this.scene.tweens) {
            resolve();
            return;
          }

          this.scene.tweens.add({
            targets: this,
            scaleX: this.originalScale,
            duration: duration / 2,
            ease: "Power2",
            onComplete: () => resolve(),
          });
        },
      });
    });
  }

  public playDealAnimation(fromX: number, fromY: number, duration: number = 500): Promise<void> {
    this.setPosition(fromX, fromY);
    this.setScale(0.5);
    this.setAlpha(0);

    return new Promise((resolve) => {
      if (!this.scene || !this.scene.tweens) {
        resolve();
        return;
      }

      this.scene.tweens.add({
        targets: this,
        x: this.x,
        y: this.y,
        scaleX: this.originalScale,
        scaleY: this.originalScale,
        alpha: 1,
        duration,
        ease: "Back.easeOut",
        onComplete: () => resolve(),
      });
    });
  }

  /**
   * Clean up resources when destroying the card sprite
   */
  public destroy(): void {
    // Clean up touch gesture manager
    if (this.touchGestureManager) {
      this.touchGestureManager.destroy();
      this.touchGestureManager = undefined;
    }

    // Clean up tooltip
    this.hideTooltip();

    // Clean up timers
    if (this.tooltipTimer) {
      this.tooltipTimer.remove();
      this.tooltipTimer = undefined;
    }

    // Call parent destroy
    super.destroy();
  }
}
