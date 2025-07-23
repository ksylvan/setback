import { Card } from "@/entities/Card";
import { Suit, Rank } from "@/types/game";

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
  private isRevealed: boolean = true;
  private isSelectable: boolean = true;
  private isSelected: boolean = false;
  private isHovered: boolean = false;

  // Animation properties
  private originalScale: number = 1;
  private hoverScale: number = 1.05;
  private selectedScale: number = 1.1;
  private animationDuration: number = 150;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    card: Card,
    theme: CardTheme
  ) {
    super(scene, x, y);

    this.card = card;
    this.theme = theme;
    this.originalScale = 1;

    this.createCardComponents();
    this.setupInteractivity();
    this.updateDisplay();

    scene.add.existing(this);
  }

  /**
   * Create the visual components of the card
   */
  private createCardComponents(): void {
    const { cardWidth, cardHeight, colors } = this.theme;

    // Highlight overlay (initially invisible)
    this.highlight = this.scene.add.rectangle(
      0,
      0,
      cardWidth,
      cardHeight,
      colors.highlight,
      0
    );
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
      return "card-joker-red";
    }

    const suit = this.card.suit?.toLowerCase();
    const rank = this.getRankDisplay();

    return `card-${suit}-${rank}`;
  }

  /**
   * Setup interactive behavior
   */
  private setupInteractivity(): void {
    this.setSize(this.theme.cardWidth, this.theme.cardHeight);
    this.setInteractive();

    // Hover effects
    this.on("pointerover", () => this.onHover(true));
    this.on("pointerout", () => this.onHover(false));

    // Click/tap handling
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
  }

  /**
   * Handle hover state changes
   */
  private onHover(isHovering: boolean): void {
    if (!this.isSelectable) return;

    this.isHovered = isHovering;
    this.updateVisualState();
  }

  /**
   * Handle selection
   */
  private onSelect(): void {
    if (!this.isSelectable) return;

    this.isSelected = !this.isSelected;
    this.updateVisualState();

    // Emit selection event
    this.emit("cardSelected", {
      card: this.card,
      selected: this.isSelected,
      sprite: this,
    });
  }

  /**
   * Update visual state based on hover/selection
   */
  private updateVisualState(): void {
    let targetScale = this.originalScale;
    let highlightAlpha = 0;

    if (this.isSelected) {
      targetScale = this.selectedScale;
      highlightAlpha = 0.3;
    } else if (this.isHovered) {
      targetScale = this.hoverScale;
      highlightAlpha = 0.15;
    }

    // Smooth scale animation
    this.scene.tweens.add({
      targets: this,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: this.animationDuration,
      ease: "Power2",
    });

    // Highlight animation
    this.scene.tweens.add({
      targets: this.highlight,
      alpha: highlightAlpha,
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
        return this.card.rank.toString();
    }
  }

  private getSuitSymbol(): string {
    switch (this.card.suit) {
      case Suit.HEARTS:
        return "♥";
      case Suit.DIAMONDS:
        return "♦";
      case Suit.CLUBS:
        return "♣";
      case Suit.SPADES:
        return "♠";
      default:
        return "?";
    }
  }

  /**
   * Apply theme-specific visual effects
   */
  private applyThemeEffects(): void {
    const { colors } = this.theme;

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
    this.updateVisualState();
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
      this.scene.tweens.add({
        targets: this,
        scaleX: 0,
        duration: duration / 2,
        ease: "Power2",
        onComplete: () => {
          this.isRevealed = !this.isRevealed;
          this.updateDisplay();

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

  public playDealAnimation(
    fromX: number,
    fromY: number,
    duration: number = 500
  ): Promise<void> {
    this.setPosition(fromX, fromY);
    this.setScale(0.5);
    this.setAlpha(0);

    return new Promise((resolve) => {
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
}
