import type { Card } from "@/entities/Card";

/**
 * CardTooltip - Efficient tooltip component with object pooling
 * Displays comprehensive card information and playability status
 *
 * Features:
 * - Object pooling for performance
 * - Smooth animations with 60fps target
 * - Dynamic positioning to stay on screen
 * - Accessibility support with ARIA labels
 */
export class CardTooltip extends Phaser.GameObjects.Container {
  private background!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private reasonText!: Phaser.GameObjects.Text;
  private arrow!: Phaser.GameObjects.Triangle;

  // Visual constants
  private static readonly TOOLTIP_WIDTH = 200;
  private static readonly TOOLTIP_HEIGHT = 120;
  private static readonly PADDING = 12;
  private static readonly ARROW_SIZE = 8;
  private static readonly ANIMATION_DURATION = 150;

  // Pool management
  private static pool: CardTooltip[] = [];
  private static maxPoolSize = 5;
  private inUse = false;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.createComponents();
    this.setVisible(false);
    this.setAlpha(0);

    scene.add.existing(this);
  }

  /**
   * Get a tooltip instance from the pool or create new one
   */
  public static getFromPool(scene: Phaser.Scene): CardTooltip {
    // Find a tooltip that's not in use AND has the same scene
    // This prevents using tooltips with stale scene references
    const pooled = CardTooltip.pool.find((tooltip) => !tooltip.inUse && tooltip.scene === scene && tooltip.scene);

    if (pooled) {
      pooled.inUse = true;
      return pooled;
    }

    // Create new instance if no suitable pooled tooltip found
    const tooltip = new CardTooltip(scene);
    tooltip.inUse = true;

    // Add to pool if there's space
    if (CardTooltip.pool.length < CardTooltip.maxPoolSize) {
      CardTooltip.pool.push(tooltip);
    }

    return tooltip;
  }

  /**
   * Return tooltip to pool for reuse
   */
  public returnToPool(): void {
    this.inUse = false;
    this.setVisible(false);
    this.setAlpha(0);

    // Clear any running tweens - with safety check
    if (this.scene?.tweens) {
      this.scene.tweens.killTweensOf(this);
    }
  }

  /**
   * Create visual components with optimized styling
   */
  private createComponents(): void {
    // Safety check: ensure scene is available
    if (!this.scene) {
      console.error("CardTooltip: Cannot create components without scene");
      return;
    }

    // Background with drop shadow effect
    this.background = this.scene.add.rectangle(
      0,
      0,
      CardTooltip.TOOLTIP_WIDTH,
      CardTooltip.TOOLTIP_HEIGHT,
      0x2a2a2a,
      0.95
    );
    this.background.setStrokeStyle(2, 0x555555);
    this.add(this.background);

    // Drop shadow for depth
    const shadow = this.scene.add.rectangle(2, 2, CardTooltip.TOOLTIP_WIDTH, CardTooltip.TOOLTIP_HEIGHT, 0x000000, 0.3);
    this.addAt(shadow, 0); // Add behind background

    // Card title text (e.g., "Ace of Hearts")
    this.titleText = this.scene.add.text(0, -CardTooltip.TOOLTIP_HEIGHT / 2 + 20, "", {
      fontSize: "14px",
      fontStyle: "bold",
      color: "#FFD700",
      align: "center",
      wordWrap: { width: CardTooltip.TOOLTIP_WIDTH - CardTooltip.PADDING * 2 },
    });
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);

    // Playability status (e.g., "Playable" or "Cannot Play")
    this.statusText = this.scene.add.text(0, -10, "", {
      fontSize: "12px",
      fontStyle: "bold",
      color: "#ffffff",
      align: "center",
    });
    this.statusText.setOrigin(0.5);
    this.add(this.statusText);

    // Reason text (e.g., "Must follow Hearts suit")
    this.reasonText = this.scene.add.text(0, CardTooltip.TOOLTIP_HEIGHT / 2 - 20, "", {
      fontSize: "11px",
      color: "#cccccc",
      align: "center",
      wordWrap: { width: CardTooltip.TOOLTIP_WIDTH - CardTooltip.PADDING * 2 },
    });
    this.reasonText.setOrigin(0.5);
    this.add(this.reasonText);

    // Arrow pointing to card (will be positioned dynamically)
    this.arrow = this.scene.add.triangle(
      0,
      CardTooltip.TOOLTIP_HEIGHT / 2 + CardTooltip.ARROW_SIZE,
      0,
      0,
      CardTooltip.ARROW_SIZE,
      CardTooltip.ARROW_SIZE * 2,
      -CardTooltip.ARROW_SIZE,
      CardTooltip.ARROW_SIZE * 2,
      0x2a2a2a
    );
    this.add(this.arrow);
  }

  /**
   * Show tooltip for a specific card with playability information
   */
  public showForCard(card: Card, x: number, y: number, playable: boolean, reason?: string): void {
    // Basic safety check: ensure scene exists
    if (!this.scene) {
      console.warn("CardTooltip: Scene not available, cannot show tooltip");
      return;
    }

    // Update content
    this.updateContent(card, playable, reason);

    // Position tooltip with smart placement
    this.positionTooltip(x, y);

    // Show with smooth animation
    this.showWithAnimation();

    // Add accessibility attributes
    this.setAccessibilityAttributes(card, playable, reason);
  }

  /**
   * Update tooltip content based on card and game state
   */
  private updateContent(card: Card, playable: boolean, reason?: string): void {
    // Safety check: ensure scene and components are available
    if (!this.scene || !this.titleText || !this.statusText || !this.reasonText) {
      console.warn("CardTooltip: Scene or text components not available, skipping content update");
      return;
    }

    // Card title
    this.titleText.setText(card.displayName);

    // Playability status with color coding
    if (playable) {
      this.statusText.setText("✓ PLAYABLE");
      this.statusText.setColor("#4CAF50"); // Green
    } else {
      this.statusText.setText("✗ CANNOT PLAY");
      this.statusText.setColor("#F44336"); // Red
    }

    // Detailed reason
    let reasonDisplay = "";
    if (reason) {
      reasonDisplay = reason;
    } else if (playable) {
      reasonDisplay = "This card can be played";
    } else {
      reasonDisplay = "This card cannot be played";
    }

    // Add card value information for strategic play
    const additionalInfo = this.getCardValueInfo(card);
    if (additionalInfo) {
      reasonDisplay += `\n${additionalInfo}`;
    }

    this.reasonText.setText(reasonDisplay);
  }

  /**
   * Get strategic information about the card
   */
  private getCardValueInfo(card: Card): string {
    const info: string[] = [];

    // Point values for scoring
    if (card.rank === 11) info.push("Jack (1 point)"); // Jack
    if (card.rank === 12) info.push("Queen (2 points)"); // Queen
    if (card.rank === 13) info.push("King (3 points)"); // King
    if (card.rank === 14) info.push("Ace (4 points)"); // Ace
    if (card.rank === 10) info.push("Ten (10 points)"); // Ten
    if (card.isJoker) info.push("Joker (1 point)");

    return info.join(", ");
  }

  /**
   * Smart positioning to keep tooltip on screen
   */
  private positionTooltip(targetX: number, targetY: number): void {
    // Safety check: ensure scene and camera are available
    if (!this.scene || !this.scene.cameras || !this.scene.cameras.main) {
      console.warn("CardTooltip: Scene or camera not available, using default positioning");
      this.setPosition(targetX, targetY - 100);
      return;
    }

    const camera = this.scene.cameras.main;
    const margin = 20;

    let tooltipX = targetX;
    let tooltipY = targetY - CardTooltip.TOOLTIP_HEIGHT / 2 - 40; // Above card by default

    // Adjust if tooltip would go off screen
    if (tooltipX - CardTooltip.TOOLTIP_WIDTH / 2 < margin) {
      tooltipX = margin + CardTooltip.TOOLTIP_WIDTH / 2;
    }
    if (tooltipX + CardTooltip.TOOLTIP_WIDTH / 2 > camera.width - margin) {
      tooltipX = camera.width - margin - CardTooltip.TOOLTIP_WIDTH / 2;
    }

    // If tooltip would go off top, show below card instead
    if (tooltipY < margin) {
      tooltipY = targetY + CardTooltip.TOOLTIP_HEIGHT / 2 + 40;
      // Flip arrow to point up
      this.arrow.setPosition(0, -CardTooltip.TOOLTIP_HEIGHT / 2 - CardTooltip.ARROW_SIZE);
      this.arrow.setRotation(Math.PI);
    } else {
      // Reset arrow to point down
      this.arrow.setPosition(0, CardTooltip.TOOLTIP_HEIGHT / 2 + CardTooltip.ARROW_SIZE);
      this.arrow.setRotation(0);
    }

    // Adjust arrow horizontal position to point to card
    const arrowX = Math.max(
      -CardTooltip.TOOLTIP_WIDTH / 2 + 20,
      Math.min(CardTooltip.TOOLTIP_WIDTH / 2 - 20, targetX - tooltipX)
    );
    this.arrow.x = arrowX;

    this.setPosition(tooltipX, tooltipY);
  }

  /**
   * Show tooltip with smooth fade-in animation
   */
  private showWithAnimation(): void {
    this.setVisible(true);
    this.setAlpha(0);
    this.setScale(0.8);

    // Safety check: ensure scene and tweens are available
    if (!this.scene || !this.scene.tweens) {
      console.warn("CardTooltip: Scene or tweens not available, showing without animation");
      this.setAlpha(1);
      this.setScale(1);
      return;
    }

    // Cancel any existing animations
    this.scene.tweens.killTweensOf(this);

    // Smooth fade-in with slight scale animation
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: CardTooltip.ANIMATION_DURATION,
      ease: "Back.easeOut",
    });
  }

  /**
   * Hide tooltip with smooth fade-out animation
   */
  public hide(): void {
    // Safety check: ensure scene and tweens are available
    if (!this.scene || !this.scene.tweens) {
      console.warn("CardTooltip: Scene or tweens not available, hiding without animation");
      this.setVisible(false);
      this.setAlpha(0);
      this.returnToPool();
      return;
    }

    // Cancel any existing animations
    this.scene.tweens.killTweensOf(this);

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: CardTooltip.ANIMATION_DURATION,
      ease: "Power2.easeIn",
      onComplete: () => {
        this.setVisible(false);
        this.returnToPool();
      },
    });
  }

  /**
   * Set accessibility attributes for screen readers
   */
  private setAccessibilityAttributes(card: Card, playable: boolean, reason?: string): void {
    // Create accessible description
    let description = `Card: ${card.displayName}. `;
    description += playable ? "This card is playable. " : "This card cannot be played. ";
    if (reason) {
      description += reason;
    }

    // Add strategic info
    const valueInfo = this.getCardValueInfo(card);
    if (valueInfo) {
      description += ` ${valueInfo}`;
    }

    // Set ARIA attributes on the container
    this.setData("aria-label", description);
    this.setData("role", "tooltip");
    this.setData("aria-live", "polite");
  }

  /**
   * Clear tooltips for a specific scene (call when scene is destroyed)
   */
  public static clearPoolForScene(scene: Phaser.Scene): void {
    CardTooltip.pool = CardTooltip.pool.filter((tooltip) => tooltip.scene !== scene);
  }

  /**
   * Static method to clean up all pooled tooltips
   */
  public static destroyPool(): void {
    CardTooltip.pool.forEach((tooltip) => {
      tooltip.destroy();
    });
    CardTooltip.pool = [];
  }
}
