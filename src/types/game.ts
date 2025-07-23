// Core game enums and types for Setback card game
import type { Card } from "@/entities/Card";

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
