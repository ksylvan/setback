import type { CardSprite } from "@/components/CardSprite";
import type { KeyboardNavigationEvent } from "@/types/interaction";
import { validateKeyboardAction } from "@/utils/InteractionUtils";

/**
 * KeyboardManager - Comprehensive keyboard navigation and accessibility
 *
 * Features:
 * - Full game control via keyboard
 * - WCAG 2.1 compliant navigation
 * - Screen reader announcements
 * - Configurable key bindings
 * - Focus management
 */
export class KeyboardManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private enabled: boolean = true;
  private focusedCardIndex: number = -1;
  private selectableCards: CardSprite[] = [];
  private selectedCard: CardSprite | null = null;

  // Key binding configuration
  private keyBindings = {
    navigate: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
    select: ["Enter", "Space"],
    confirm: ["Enter"],
    cancel: ["Escape"],
    tab: ["Tab"],
    help: ["F1", "KeyH"],
  };

  // Accessibility settings
  private accessibilityEnabled = true;
  private announcements: string[] = [];
  private lastAnnouncement = 0;

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    this.setupKeyboardListeners();
    this.setupAccessibilityFeatures();
  }

  /**
   * Enable keyboard navigation
   */
  public enable(): void {
    this.enabled = true;
    this.emit("keyboardEnabled");
    this.announce("Keyboard navigation enabled");
  }

  /**
   * Disable keyboard navigation
   */
  public disable(): void {
    this.enabled = false;
    this.clearFocus();
    this.emit("keyboardDisabled");
  }

  /**
   * Update the list of selectable cards
   */
  public updateSelectableCards(cards: CardSprite[]): void {
    // Clear existing focus
    this.clearFocus();

    // Update selectable cards list - only include valid cards
    this.selectableCards = cards.filter(
      (card) => card?.scene && card.active && card.visible && typeof card.setFocused === "function"
    );

    // Reset focus to first card if available
    if (this.selectableCards.length > 0) {
      this.focusedCardIndex = 0;
      this.updateFocus();
    } else {
      this.focusedCardIndex = -1;
    }

    this.emit("selectableCardsUpdated", {
      count: this.selectableCards.length,
    });
  }

  /**
   * Set focus to a specific card by index
   */
  public focusCard(index: number): void {
    if (!this.enabled || index < 0 || index >= this.selectableCards.length) {
      return;
    }

    this.focusedCardIndex = index;
    this.updateFocus();

    const card = this.selectableCards[index];
    if (card?.getCard && typeof card.getCard === "function") {
      this.announce(`Focused on ${card.getCard().displayName}`);
    }
  }

  /**
   * Get currently focused card
   */
  public getFocusedCard(): CardSprite | null {
    if (this.focusedCardIndex >= 0 && this.focusedCardIndex < this.selectableCards.length) {
      const card = this.selectableCards[this.focusedCardIndex];
      return card?.scene ? card : null;
    }
    return null;
  }

  /**
   * Get currently selected card
   */
  public getSelectedCard(): CardSprite | null {
    return this.selectedCard;
  }

  /**
   * Setup keyboard event listeners
   */
  private setupKeyboardListeners(): void {
    // Listen to keyboard events on the scene
    this.scene.input.keyboard?.on("keydown", this.handleKeyPress.bind(this));

    // Prevent default browser behavior for game keys
    this.scene.input.keyboard?.addCapture(["SPACE", "ENTER", "ESC", "LEFT", "RIGHT", "UP", "DOWN", "TAB", "F1"]);
  }

  /**
   * Handle keyboard input
   */
  private handleKeyPress(event: KeyboardEvent): void {
    if (!this.enabled || this.selectableCards.length === 0) {
      return;
    }

    const key = event.code;
    const currentIndex = this.focusedCardIndex;
    const totalCards = this.selectableCards.length;
    const hasSelection = this.selectedCard !== null;

    // Prevent default for handled keys
    if (this.isHandledKey(key)) {
      event.preventDefault();
    }

    // Validate and process the keyboard action
    const validation = validateKeyboardAction(key, currentIndex, totalCards, hasSelection);

    if (!validation.valid) {
      return;
    }

    // Process the action
    switch (validation.action) {
      case "navigate":
        if (validation.newIndex !== undefined) {
          this.navigateToCard(validation.newIndex);
        }
        break;

      case "select":
        this.selectFocusedCard();
        break;

      case "confirm":
        this.confirmSelectedCard();
        break;

      case "cancel":
        this.cancelSelection();
        break;
    }

    // Handle special keys
    if (key === "F1" || key === "KeyH") {
      this.showHelp();
    }

    // Emit navigation event
    const navEvent: KeyboardNavigationEvent = {
      key,
      cardIndex: this.focusedCardIndex,
      totalCards,
      action: validation.action || "navigate",
    };

    this.emit("keyboardNavigation", navEvent);
  }

  /**
   * Navigate to a specific card index
   */
  private navigateToCard(index: number): void {
    const previousIndex = this.focusedCardIndex;
    this.focusedCardIndex = index;
    this.updateFocus();

    // Announce navigation
    const card = this.selectableCards[index];
    if (!card || !card.getDisplayState || !card.getCard) {
      return;
    }

    const displayState = card.getDisplayState();
    const cardData = card.getCard();

    if (!cardData) {
      return;
    }

    let announcement = `${cardData.displayName}`;
    if (displayState.playable) {
      announcement += ", playable";
    } else {
      announcement += ", cannot play";
      if (displayState.reason) {
        announcement += `, ${displayState.reason}`;
      }
    }

    this.announce(announcement);

    // Emit navigation event
    this.emit("cardFocusChanged", {
      previousIndex,
      currentIndex: index,
      card: card.getCard(),
    });
  }

  /**
   * Select the currently focused card
   */
  private selectFocusedCard(): void {
    const focusedCard = this.getFocusedCard();
    if (!focusedCard) return;

    // If there's already a selection, clear it first
    if (this.selectedCard && this.selectedCard !== focusedCard) {
      this.selectedCard.setSelected(false);
    }

    // Select the focused card
    this.selectedCard = focusedCard;
    focusedCard.setSelected(true);

    const card = focusedCard.getCard();
    const displayState = focusedCard.getDisplayState();

    if (displayState.playable) {
      this.announce(`Selected ${card.displayName}. Press Enter again to confirm, or Escape to cancel.`);
    } else {
      this.announce(`Cannot select ${card.displayName}. ${displayState.reason || "This card is not playable."}`);
      // Don't actually select unplayable cards
      this.selectedCard = null;
      focusedCard.setSelected(false);
      return;
    }

    // Emit selection event
    this.emit("cardSelected", {
      card: card,
      sprite: focusedCard,
      method: "keyboard",
    });
  }

  /**
   * Confirm the selected card for play
   */
  private confirmSelectedCard(): void {
    if (!this.selectedCard) {
      // If no selection, select the focused card
      this.selectFocusedCard();
      return;
    }

    const card = this.selectedCard.getCard();
    this.announce(`Playing ${card.displayName}`);

    // Emit confirmation event
    this.emit("cardConfirmed", {
      card: card,
      sprite: this.selectedCard,
      method: "keyboard",
    });

    // Clear selection after confirmation
    this.selectedCard.setSelected(false);
    this.selectedCard = null;
  }

  /**
   * Cancel current selection
   */
  private cancelSelection(): void {
    if (!this.selectedCard) return;

    const card = this.selectedCard.getCard();
    this.announce(`Cancelled selection of ${card.displayName}`);

    // Clear selection
    this.selectedCard.setSelected(false);
    this.selectedCard = null;

    // Emit cancellation event
    this.emit("cardCancelled", {
      card: card,
      method: "keyboard",
    });
  }

  /**
   * Update visual focus indicators
   */
  private updateFocus(): void {
    // Clear focus from all cards
    this.selectableCards.forEach((card) => {
      // Safety check: ensure card is still valid before calling setFocused
      if (card?.scene && typeof card.setFocused === "function") {
        card.setFocused(false);
      }
    });

    // Set focus on current card
    if (this.focusedCardIndex >= 0 && this.focusedCardIndex < this.selectableCards.length) {
      const focusedCard = this.selectableCards[this.focusedCardIndex];
      if (focusedCard?.scene && typeof focusedCard.setFocused === "function") {
        focusedCard.setFocused(true);
      }
    }
  }

  /**
   * Clear focus from all cards
   */
  private clearFocus(): void {
    this.selectableCards.forEach((card) => {
      // Safety check: ensure card is still valid before calling setFocused
      if (card?.scene && typeof card.setFocused === "function") {
        card.setFocused(false);
      }
    });
    this.focusedCardIndex = -1;
  }

  /**
   * Check if a key is handled by the keyboard manager
   */
  private isHandledKey(key: string): boolean {
    return Object.values(this.keyBindings).some((keys) => keys.includes(key));
  }

  /**
   * Setup accessibility features
   */
  private setupAccessibilityFeatures(): void {
    // Detect if screen reader is active
    this.detectScreenReader();

    // Setup live region for announcements
    this.createLiveRegion();
  }

  /**
   * Detect if screen reader is being used
   */
  private detectScreenReader(): void {
    // Simple detection - in a real app, you'd use more sophisticated methods
    const hasScreenReader =
      window.navigator.userAgent.includes("NVDA") ||
      window.navigator.userAgent.includes("JAWS") ||
      window.speechSynthesis?.getVoices().length > 0;

    this.accessibilityEnabled = hasScreenReader;
  }

  /**
   * Create live region for screen reader announcements
   */
  private createLiveRegion(): void {
    // Create hidden live region for announcements
    const liveRegion = document.createElement("div");
    liveRegion.id = "keyboard-manager-live-region";
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;

    document.body.appendChild(liveRegion);
  }

  /**
   * Announce text to screen readers
   */
  private announce(text: string): void {
    // Throttle announcements to prevent spam
    const now = Date.now();
    if (now - this.lastAnnouncement < 100) {
      return;
    }
    this.lastAnnouncement = now;

    // Add to announcements queue
    this.announcements.push(text);

    // Update live region
    const liveRegion = document.getElementById("keyboard-manager-live-region");
    if (liveRegion && this.accessibilityEnabled) {
      liveRegion.textContent = text;
    }

    // Emit announcement event
    this.emit("announcement", { text });
  }

  /**
   * Show keyboard help
   */
  private showHelp(): void {
    const helpText = `
Keyboard Navigation Help:
- Arrow keys: Navigate between cards
- Enter/Space: Select focused card
- Enter (when card selected): Confirm play
- Escape: Cancel selection
- Tab: Cycle through cards
- F1 or H: Show this help
    `;

    this.announce(helpText);
    this.emit("helpRequested", { helpText });
  }

  /**
   * Get current navigation state
   */
  public getNavigationState() {
    return {
      enabled: this.enabled,
      focusedIndex: this.focusedCardIndex,
      selectedCard: this.selectedCard?.getCard() || null,
      totalCards: this.selectableCards.length,
      accessibilityEnabled: this.accessibilityEnabled,
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.disable();
    this.removeAllListeners();

    // Remove live region
    const liveRegion = document.getElementById("keyboard-manager-live-region");
    if (liveRegion) {
      liveRegion.remove();
    }
  }
}
