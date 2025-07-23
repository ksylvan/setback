import type { Card } from "@/entities/Card";

/**
 * Card Display State Interface
 * Defines all possible visual states for a card
 */
export interface CardDisplayState {
  playable: boolean;
  selected: boolean;
  highlighted: boolean;
  dimmed: boolean;
  reason?: string; // Why card is/isn't playable
}

/**
 * Interaction Event Interface
 * Comprehensive event data for card interactions
 */
export interface CardInteractionEvent {
  card: Card;
  action: "hover" | "select" | "confirm" | "cancel";
  timestamp: number;
  playable: boolean;
  reason?: string;
}

/**
 * Keyboard Navigation Event Interface
 */
export interface KeyboardNavigationEvent {
  key: string;
  cardIndex: number;
  totalCards: number;
  action: "navigate" | "select" | "confirm" | "cancel";
}

/**
 * Touch Gesture Event Interface
 */
export interface TouchGestureEvent {
  type: "tap" | "long_press" | "double_tap";
  x: number;
  y: number;
  card?: Card;
  duration?: number;
}

/**
 * Turn Indication State Interface
 */
export interface TurnIndicationState {
  currentPlayerId: string;
  playerName: string;
  instruction: string;
  timeRemaining?: number;
  canAct: boolean;
}

/**
 * Accessibility State Interface
 */
export interface AccessibilityState {
  screenReaderEnabled: boolean;
  keyboardNavigationEnabled: boolean;
  highContrastMode: boolean;
  announcements: string[];
}

/**
 * Interaction Validation Result
 */
export interface InteractionValidationResult {
  valid: boolean;
  reason?: string;
  suggestedActions?: string[];
}

/**
 * Card Selection State
 * Tracks the confirm-to-play interaction pattern
 */
export interface CardSelectionState {
  selectedCard: Card | null;
  confirmationRequired: boolean;
  selectionTime: number;
  autoConfirmTimeout?: number;
}

/**
 * Mobile Touch Configuration
 */
export interface TouchConfiguration {
  tapDelay: number; // ms before registering tap
  longPressDelay: number; // ms before long press
  doubleTapDelay: number; // ms window for double tap
  preventDefaults: boolean; // prevent scroll/zoom
}

/**
 * Animation Configuration
 */
export interface AnimationConfiguration {
  hoverDuration: number;
  selectionDuration: number;
  tooltipDelay: number;
  confirmationTimeout: number;
  feedbackDuration: number;
}

/**
 * Interaction Settings Interface
 * User-configurable interaction preferences
 */
export interface InteractionSettings {
  confirmToPlay: boolean;
  showTooltips: boolean;
  tooltipDelay: number;
  keyboardNavigation: boolean;
  audioFeedback: boolean;
  hapticsEnabled: boolean;
  animationSpeed: "slow" | "normal" | "fast";
  accessibilityMode: boolean;
}

/**
 * Error types for interaction validation
 */
export enum InteractionError {
  INVALID_CARD = "invalid_card",
  NOT_PLAYER_TURN = "not_player_turn",
  CARD_NOT_PLAYABLE = "card_not_playable",
  GAME_PHASE_MISMATCH = "game_phase_mismatch",
  CONFIRMATION_REQUIRED = "confirmation_required",
  TIMEOUT = "timeout",
  ACCESSIBILITY_VIOLATION = "accessibility_violation",
}

/**
 * Card Visual Feedback Types
 */
export enum VisualFeedbackType {
  HOVER = "hover",
  SELECT = "select",
  CONFIRM = "confirm",
  ERROR = "error",
  SUCCESS = "success",
  PLAYABLE = "playable",
  UNPLAYABLE = "unplayable",
  FOCUS = "focus",
}

/**
 * Audio Feedback Types
 */
export enum AudioFeedbackType {
  HOVER = "card_hover",
  SELECT = "card_select",
  CONFIRM = "card_confirm",
  ERROR = "error_sound",
  SUCCESS = "success_sound",
  TURN_START = "turn_start",
  KEYBOARD_NAV = "keyboard_nav",
}
