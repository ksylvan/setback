import { beforeEach, describe, expect, it } from "vitest";
import { Rank, Suit } from "@/types/game";
import { Deck } from "./Deck";

describe("Deck", () => {
  let deck: Deck;

  beforeEach(() => {
    deck = new Deck();
  });

  describe("constructor", () => {
    it("should create a deck with 53 cards (52 + joker)", () => {
      expect(deck.remainingCards).toBe(53);
    });

    it("should include one joker", () => {
      const allCards = deck.getAllCards();
      const jokers = allCards.filter((card) => card.isJoker);
      expect(jokers.length).toBe(1);
    });

    it("should include 13 cards of each suit", () => {
      const allCards = deck.getAllCards();
      const hearts = allCards.filter((card) => card.suit === Suit.HEARTS);
      const diamonds = allCards.filter((card) => card.suit === Suit.DIAMONDS);
      const clubs = allCards.filter((card) => card.suit === Suit.CLUBS);
      const spades = allCards.filter((card) => card.suit === Suit.SPADES);

      expect(hearts.length).toBe(13);
      expect(diamonds.length).toBe(13);
      expect(clubs.length).toBe(13);
      expect(spades.length).toBe(13);
    });

    it("should include all ranks for each suit", () => {
      const expectedRanks = [
        Rank.TWO,
        Rank.THREE,
        Rank.FOUR,
        Rank.FIVE,
        Rank.SIX,
        Rank.SEVEN,
        Rank.EIGHT,
        Rank.NINE,
        Rank.TEN,
        Rank.JACK,
        Rank.QUEEN,
        Rank.KING,
        Rank.ACE,
      ];

      const allCards = deck.getAllCards();
      for (const suit of [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES]) {
        const suitCards = allCards.filter((card) => card.suit === suit);
        const suitRanks = suitCards.map((card) => card.rank).sort();
        expect(suitRanks).toEqual(expectedRanks.sort());
      }
    });
  });

  describe("shuffle", () => {
    it("should maintain the same number of cards after shuffling", () => {
      const originalLength = deck.remainingCards;
      deck.shuffle();
      expect(deck.remainingCards).toBe(originalLength);
    });

    it("should change the order of cards (probabilistic test)", () => {
      const originalOrder = [...deck.getAllCards()];
      deck.shuffle();
      const newOrder = deck.getAllCards();

      // It's extremely unlikely (but not impossible) that shuffle produces same order
      // This test may occasionally fail, but it's a reasonable check
      const sameOrder = newOrder.every((card, index) => card.id === originalOrder[index].id);
      expect(sameOrder).toBe(false);
    });

    it("should maintain all unique cards after shuffling", () => {
      deck.shuffle();
      const allCards = deck.getAllCards();
      const cardIds = allCards.map((card) => card.id);
      const uniqueIds = new Set(cardIds);
      expect(uniqueIds.size).toBe(cardIds.length);
    });
  });

  describe("dealCard", () => {
    it("should return a card and reduce deck size", () => {
      const originalLength = deck.remainingCards;
      const drawnCard = deck.dealCard();

      expect(drawnCard).toBeDefined();
      expect(deck.remainingCards).toBe(originalLength - 1);
    });

    it("should return the top card from the deck", () => {
      const allCards = deck.getAllCards();
      const topCard = allCards[allCards.length - 1];
      const drawnCard = deck.dealCard();

      expect(drawnCard?.id).toBe(topCard.id);
    });

    it("should return null when deck is empty", () => {
      // Draw all cards
      while (!deck.isEmpty) {
        deck.dealCard();
      }

      const drawnCard = deck.dealCard();
      expect(drawnCard).toBe(null);
    });
  });

  describe("isEmpty", () => {
    it("should return false for a new deck", () => {
      expect(deck.isEmpty).toBe(false);
    });

    it("should return true when all cards are drawn", () => {
      // Draw all cards
      while (!deck.isEmpty) {
        deck.dealCard();
      }

      expect(deck.isEmpty).toBe(true);
    });
  });

  describe("remainingCards", () => {
    it("should return correct count for new deck", () => {
      expect(deck.remainingCards).toBe(53);
    });

    it("should decrease as cards are drawn", () => {
      deck.dealCard();
      expect(deck.remainingCards).toBe(52);

      deck.dealCard();
      expect(deck.remainingCards).toBe(51);
    });

    it("should return 0 when deck is empty", () => {
      // Draw all cards
      while (!deck.isEmpty) {
        deck.dealCard();
      }

      expect(deck.remainingCards).toBe(0);
    });
  });

  describe("dealCards", () => {
    it("should deal requested number of cards", () => {
      const cards = deck.dealCards(6);

      expect(cards.length).toBe(6);
    });

    it("should deal different cards", () => {
      const cards = deck.dealCards(10);
      const cardIds = cards.map((card) => card.id);
      const uniqueIds = new Set(cardIds);

      expect(uniqueIds.size).toBe(cardIds.length);
    });

    it("should reduce deck size by cards dealt", () => {
      const originalSize = deck.remainingCards;
      const cards = deck.dealCards(6);

      expect(deck.remainingCards).toBe(originalSize - cards.length);
    });

    it("should return fewer cards if deck runs out", () => {
      // Deal most cards first
      deck.dealCards(50);

      const remainingCards = deck.dealCards(10); // Try to deal 10 but only 3 left
      expect(remainingCards.length).toBe(3);
    });
  });
});
