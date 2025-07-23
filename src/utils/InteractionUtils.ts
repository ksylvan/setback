import type { Card } from "@/entities/Card";
import type { GameState, Player } from "@/types/game";
import type { CardDisplayState, CardInteractionEvent, InteractionValidationResult } from "@/types/interaction";
import { InteractionError } from "@/types/interaction";

/**
 * InteractionUtils - Validation and feedback utilities
 * Centralizes interaction validation logic and provides helpful error messaging
 */

/**
 * Validate if a card can be played by a player in the current game state
 */
export function validateCardPlay(card: Card, player: Player, gameState: GameState): InteractionValidationResult {
  // Basic game state checks
  if (gameState.gamePhase !== "playing") {
    return {
      valid: false,
      reason: "Not in playing phase - wait for bidding to complete",
      suggestedActions: ["Wait for your turn to play cards"],
    };
  }

  // Check if it's the player's turn
  const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];
  if (currentPlayer.id !== player.id) {
    console.log(
      `🚨 CARD VALIDATION: Player ${player.name} trying to play, but current player is ${currentPlayer.name}`
    );
    console.log(`🚨 Player ID: ${player.id}, Current Player ID: ${currentPlayer.id}`);
    console.log(`🚨 Game Phase: ${gameState.gamePhase}`);
    return {
      valid: false,
      reason: `Not your turn - ${currentPlayer.name} is playing`,
      suggestedActions: ["Wait for other players to complete their turns"],
    };
  }

  // Check if player has cards
  if (player.hand.length === 0) {
    return {
      valid: false,
      reason: "You have no cards to play",
      suggestedActions: ["Contact support - this should not happen"],
    };
  }

  // Check if player actually has this card
  const hasCard = player.hand.some((c) => c.id === card.id);
  if (!hasCard) {
    return {
      valid: false,
      reason: "You do not have this card in your hand",
      suggestedActions: ["Select a card from your hand"],
    };
  }

  // Trump suit and lead suit logic
  const trumpSuit = gameState.currentHand.trumpSuit;
  const currentTrick = gameState.currentHand.currentTrick;
  const leadSuit = currentTrick?.leadSuit;

  // Special case: Cannot lead with joker if trump not established
  if (card.isJoker && !trumpSuit && !leadSuit) {
    return {
      valid: false,
      reason: "Cannot lead with Joker - play a regular card first to establish trump",
      suggestedActions: ["Select a non-Joker card to lead"],
    };
  }

  // Follow suit validation
  if (leadSuit) {
    const leadCard = currentTrick?.cards[0]?.card;
    const canFollow = card.canFollow(leadSuit, player.hand, trumpSuit, leadCard);
    if (!canFollow) {
      // Check if player has cards of the lead suit
      const hasLeadSuit = player.hand.some((c) => c.suit === leadSuit && !c.isJoker && !c.isOffJack(trumpSuit));

      if (hasLeadSuit) {
        return {
          valid: false,
          reason: `Must follow ${leadSuit.toUpperCase()} suit - you have ${leadSuit} cards`,
          suggestedActions: [`Play a ${leadSuit.toUpperCase()} card`, "Check your hand for matching suit"],
        };
      }

      // Player can't follow suit, but this specific card still might not be playable
      // Let the Card's canFollow logic determine this
      return {
        valid: false,
        reason: `Cannot play ${card.displayName} - check suit following rules`,
        suggestedActions: ["Play a card that follows suit or trump"],
      };
    }
  }

  // If we get here, the card is playable
  return {
    valid: true,
    reason: `${card.displayName} can be played`,
  };
}

/**
 * Determine the display state for a card based on game context
 */
export function getCardDisplayState(
  card: Card,
  player: Player,
  gameState: GameState,
  isSelected: boolean = false,
  isHighlighted: boolean = false
): CardDisplayState {
  const validation = validateCardPlay(card, player, gameState);

  return {
    playable: validation.valid,
    selected: isSelected,
    highlighted: isHighlighted,
    dimmed: !validation.valid,
    reason: validation.reason,
  };
}

/**
 * Generate helpful error message for invalid card play
 */
export function getPlayabilityMessage(card: Card, gameState: GameState, detailed: boolean = false): string {
  const trumpSuit = gameState.currentHand.trumpSuit;
  const currentTrick = gameState.currentHand.currentTrick;
  const leadSuit = currentTrick?.leadSuit;

  let message = `${card.displayName}: `;

  // Check specific conditions
  if (card.isJoker && !trumpSuit && !leadSuit) {
    message += "Cannot lead with Joker before trump is established";
    if (detailed) {
      message += "\nTip: Play a regular card first to set trump suit";
    }
  } else if (leadSuit) {
    message += `Must follow ${leadSuit.toUpperCase()} suit`;
    if (detailed) {
      message += `\nLead suit: ${leadSuit.toUpperCase()}`;
      if (trumpSuit) {
        message += `\nTrump suit: ${trumpSuit.toUpperCase()}`;
      }
    }
  } else {
    message += "Can be played";
    if (detailed && !trumpSuit) {
      message += "\nThis will establish trump suit";
    }
  }

  return message;
}

/**
 * Create a card interaction event
 */
export function createInteractionEvent(
  card: Card,
  action: "hover" | "select" | "confirm" | "cancel",
  playable: boolean,
  reason?: string
): CardInteractionEvent {
  return {
    card,
    action,
    timestamp: Date.now(),
    playable,
    reason,
  };
}

/**
 * Get interaction error type from validation result
 */
export function getInteractionError(validation: InteractionValidationResult): InteractionError {
  if (validation.valid) {
    throw new Error("Cannot get error for valid interaction");
  }

  const reason = validation.reason?.toLowerCase() || "";

  if (reason.includes("not your turn")) {
    return InteractionError.NOT_PLAYER_TURN;
  }
  if (reason.includes("not in playing phase")) {
    return InteractionError.GAME_PHASE_MISMATCH;
  }
  if (reason.includes("cannot play") || reason.includes("must follow")) {
    return InteractionError.CARD_NOT_PLAYABLE;
  }
  if (reason.includes("do not have")) {
    return InteractionError.INVALID_CARD;
  }

  return InteractionError.INVALID_CARD; // Default fallback
}

/**
 * Get user-friendly error message for display
 */
export function getErrorDisplayMessage(error: InteractionError, context?: any): string {
  switch (error) {
    case InteractionError.NOT_PLAYER_TURN:
      return `❌ Not your turn${context?.currentPlayer ? ` - ${context.currentPlayer} is playing` : ""}`;
    case InteractionError.GAME_PHASE_MISMATCH:
      return "❌ Cannot play cards during bidding phase";
    case InteractionError.CARD_NOT_PLAYABLE:
      return `❌ Cannot play this card${context?.reason ? ` - ${context.reason}` : ""}`;
    case InteractionError.INVALID_CARD:
      return "❌ Invalid card selection";
    case InteractionError.CONFIRMATION_REQUIRED:
      return "⚠️ Click again to confirm playing this card";
    case InteractionError.TIMEOUT:
      return "⏰ Action timed out - please try again";
    case InteractionError.ACCESSIBILITY_VIOLATION:
      return "♿ Action not accessible - use keyboard navigation";
    default:
      return "❌ Cannot perform this action";
  }
}

/**
 * Check if interaction requires confirmation (confirm-to-play pattern)
 */
export function requiresConfirmation(
  card: Card,
  gameState: GameState,
  settings?: { confirmToPlay?: boolean }
): boolean {
  // Always require confirmation if setting is enabled
  if (settings?.confirmToPlay !== false) {
    return true;
  }

  // Special cases that always require confirmation
  const trumpSuit = gameState.currentHand.trumpSuit;
  const currentTrick = gameState.currentHand.currentTrick;

  // High-value cards or game-changing plays
  if (card.isJoker) return true;
  if (card.rank === 11 && trumpSuit && card.suit === trumpSuit) return true; // Jack of trump
  if (!trumpSuit && !currentTrick?.leadSuit) return true; // First card establishes trump

  return false;
}

/**
 * Generate accessibility announcement for screen readers
 */
export function generateAccessibilityAnnouncement(event: CardInteractionEvent, _gameState: GameState): string {
  const { card, action, playable, reason } = event;
  let announcement = "";

  switch (action) {
    case "hover":
      announcement = `Card ${card.displayName}. `;
      announcement += playable ? "Playable. " : "Cannot play. ";
      if (reason) announcement += reason;
      break;

    case "select":
      announcement = `Selected ${card.displayName}. `;
      if (playable) {
        announcement += "Press Enter to confirm or Escape to cancel.";
      } else {
        announcement += reason || "This card cannot be played.";
      }
      break;

    case "confirm":
      announcement = `Playing ${card.displayName}.`;
      break;

    case "cancel":
      announcement = `Cancelled selection of ${card.displayName}.`;
      break;
  }

  return announcement;
}

/**
 * Validate keyboard navigation action
 */
export function validateKeyboardAction(
  key: string,
  currentIndex: number,
  totalCards: number,
  hasSelection: boolean
): { valid: boolean; newIndex?: number; action?: "navigate" | "select" | "confirm" | "cancel" } {
  switch (key.toLowerCase()) {
    case "arrowleft":
    case "arrowup":
      return {
        valid: currentIndex > 0,
        newIndex: Math.max(0, currentIndex - 1),
        action: "navigate",
      };

    case "arrowright":
    case "arrowdown":
      return {
        valid: currentIndex < totalCards - 1,
        newIndex: Math.min(totalCards - 1, currentIndex + 1),
        action: "navigate",
      };

    case "enter":
    case " ":
      return {
        valid: true,
        action: hasSelection ? "confirm" : "select",
      };

    case "escape":
      return {
        valid: hasSelection,
        action: "cancel",
      };

    case "tab":
      return {
        valid: true,
        newIndex: (currentIndex + 1) % totalCards,
        action: "navigate",
      };

    default:
      return { valid: false };
  }
}
