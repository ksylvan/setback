// Core game enums and types for Setback card game
import type { Card } from "@/entities/Card";
import type { CardDisplayState, CardInteractionEvent } from "./interaction";

export enum Suit {
  HEARTS = "hearts",
  DIAMONDS = "diamonds",
  CLUBS = "clubs",
  SPADES = "spades",
}

export enum Rank {
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
  SEVEN = 7,
  EIGHT = 8,
  NINE = 9,
  TEN = 10,
  JACK = 11,
  QUEEN = 12,
  KING = 13,
  ACE = 14,
  JOKER = 15,
}

export interface ICard {
  suit: Suit | null; // null for joker
  rank: Rank;
  id: string;
  isJoker: boolean;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  position: PlayerPosition;
  partnerId: string;
  isHuman: boolean;
  isDealer: boolean;
}

export enum PlayerPosition {
  NORTH = "north",
  SOUTH = "south",
  EAST = "east",
  WEST = "west",
}

export interface Partnership {
  id: string;
  player1Id: string;
  player2Id: string;
  score: number;
}

export interface Bid {
  playerId: string;
  amount: number; // 2-6 points
  passed: boolean;
}

export interface Trick {
  id: string;
  cards: Array<{
    playerId: string;
    card: Card;
  }>;
  winner: string;
  leadSuit: Suit;
}

export interface GameState {
  players: Player[];
  partnerships: Partnership[];
  currentHand: {
    trumpSuit: Suit | null;
    currentBid: Bid | null;
    biddingPhase: boolean;
    currentPlayerIndex: number;
    tricks: Trick[];
    currentTrick: Trick | null;
    bids: Bid[];
  };
  deck: Card[];
  gamePhase: GamePhase;
  winner: Partnership | null;
  // Enhanced interaction state
  cardStates?: Map<string, CardDisplayState>;
  lastInteraction?: CardInteractionEvent;
}

export enum GamePhase {
  SETUP = "setup",
  DEALING = "dealing",
  BIDDING = "bidding",
  PLAYING = "playing",
  SCORING = "scoring",
  GAME_OVER = "game_over",
}

export interface GameConfig {
  targetScore: number; // Usually 21
  players: Array<{
    name: string;
    isHuman: boolean;
  }>;
}

// Scoring related types
export interface HandScore {
  low: number; // 1 point - lowest trump card
  high: number; // 1 point - highest trump card
  jack: number; // 1 point - jack of trump (if dealt)
  offJack: number; // 1 point - jack of same color as trump (if dealt)
  joker: number; // 1 point - joker (if dealt)
  game: number; // 1 point - majority of small points
}

export interface SmallPoints {
  jack: number; // 1 point
  queen: number; // 2 points
  king: number; // 3 points
  ace: number; // 4 points
  ten: number; // 10 points
}

// Detailed scoring result for a completed hand
export interface HandScoreResult {
  points: {
    high: { winner: string; card: Card } | null;
    low: { winner: string; card: Card } | null;
    jack: { winner: string; card: Card } | null;
    offJack: { winner: string; card: Card } | null;
    joker: { winner: string; card: Card } | null;
    game: { winner: string; smallPoints: number } | null;
  };
  bidMade: boolean;
  biddingPartnership: string;
  nonBiddingPartnership: string;
  biddingPartnershipPoints: number;
  nonBiddingPartnershipPoints: number;
}

// AI-specific types for SB-011 implementation
export interface HandEvaluation {
  trumpStrength: Map<Suit, number>; // Potential trump strength per suit
  pointCards: number; // High-value cards (J, Q, K, A, 10)
  specialCards: {
    joker: boolean;
    jacks: Suit[]; // Jacks in hand
  };
  trickPotential: Map<Suit, number>; // Estimated tricks per suit
  overallStrength: number; // 0-100 hand strength score
}

export interface AIBiddingProfile {
  personality: AIPersonality;
  riskTolerance: number; // 0.5-1.5 multiplier
  aggressionLevel: number; // 0.5-1.5 multiplier
  partnershipWeight: number; // How much to consider partner
}

export enum AIPersonality {
  CONSERVATIVE = "conservative",
  BALANCED = "balanced",
  AGGRESSIVE = "aggressive",
  ADAPTIVE = "adaptive",
}

export enum HandStrength {
  VERY_WEAK = 0, // < 20: Always pass unless dealer stuck
  WEAK = 20, // 20-35: Only bid 2-3 if no competition
  MEDIUM = 35, // 35-60: Competitive bidding 2-4
  STRONG = 60, // 60-80: Aggressive bidding 3-5
  VERY_STRONG = 80, // 80+: Bid 4-6, consider shoot the moon
}
