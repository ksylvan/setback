import { Rank, Suit } from "@/types/game";
import { Card } from "./Card";

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.initializeDeck();
    this.shuffle();
  }

  /**
   * Initialize a standard 53-card deck (52 cards + 1 joker)
   */
  private initializeDeck(): void {
    this.cards = [];

    // Add standard 52 cards
    for (const suit of Object.values(Suit)) {
      for (let rank = Rank.TWO; rank <= Rank.ACE; rank++) {
        this.cards.push(new Card(suit, rank));
      }
    }

    // Add joker
    this.cards.push(new Card(null, Rank.JOKER));
  }

  /**
   * Shuffle the deck using Fisher-Yates algorithm
   */
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /**
   * Deal a single card from the top of the deck
   */
  dealCard(): Card | null {
    return this.cards.pop() || null;
  }

  /**
   * Deal multiple cards
   */
  dealCards(count: number): Card[] {
    const dealtCards: Card[] = [];
    for (let i = 0; i < count; i++) {
      const card = this.dealCard();
      if (card) {
        dealtCards.push(card);
      }
    }
    return dealtCards;
  }

  /**
   * Get remaining card count
   */
  get remainingCards(): number {
    return this.cards.length;
  }

  /**
   * Check if deck is empty
   */
  get isEmpty(): boolean {
    return this.cards.length === 0;
  }

  /**
   * Reset and reshuffle the deck
   */
  reset(): void {
    this.initializeDeck();
    this.shuffle();
  }

  /**
   * Peek at the top card without removing it
   */
  peek(): Card | null {
    return this.cards.length > 0 ? this.cards[this.cards.length - 1] : null;
  }

  /**
   * Get all remaining cards (for debugging)
   */
  getAllCards(): Card[] {
    return [...this.cards];
  }
}
