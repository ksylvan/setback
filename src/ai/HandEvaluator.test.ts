import { beforeEach, describe, expect, it } from "vitest";
import { Card } from "@/entities/Card";
import { Rank, Suit } from "@/types/game";
import { HandEvaluator } from "./HandEvaluator";

describe("HandEvaluator", () => {
  let evaluator: HandEvaluator;

  beforeEach(() => {
    evaluator = new HandEvaluator();
  });

  describe("evaluateHand", () => {
    it("should evaluate a strong trump hand correctly", () => {
      // Create a hand with strong hearts trump: Joker, Jack of Hearts, Jack of Diamonds, Ace of Hearts
      const hand = [
        new Card(null, Rank.JOKER),
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.DIAMONDS, Rank.JACK), // Off-jack for hearts
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.KING),
      ];

      const evaluation = evaluator.evaluateHand(hand);

      expect(evaluation.trumpStrength.get(Suit.HEARTS)).toBeGreaterThan(70);
      expect(evaluation.specialCards.joker).toBe(true);
      expect(evaluation.specialCards.jacks).toContain(Suit.HEARTS);
      expect(evaluation.specialCards.jacks).toContain(Suit.DIAMONDS);
      expect(evaluation.overallStrength).toBeGreaterThan(80);
    });

    it("should evaluate a weak hand correctly", () => {
      // Create a weak hand with no trump potential and few points
      const hand = [
        new Card(Suit.SPADES, Rank.TWO),
        new Card(Suit.CLUBS, Rank.THREE),
        new Card(Suit.DIAMONDS, Rank.FOUR),
        new Card(Suit.HEARTS, Rank.FIVE),
        new Card(Suit.SPADES, Rank.SIX),
        new Card(Suit.CLUBS, Rank.SEVEN),
      ];

      const evaluation = evaluator.evaluateHand(hand);

      expect(evaluation.overallStrength).toBeLessThan(20);
      expect(evaluation.specialCards.joker).toBe(false);
      expect(evaluation.specialCards.jacks).toHaveLength(0);
      expect(evaluation.pointCards).toBe(0);
    });

    it("should handle mixed strength hands", () => {
      // Medium strength hand with some trump potential and point cards
      const hand = [
        new Card(Suit.HEARTS, Rank.QUEEN),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.ACE),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.NINE),
        new Card(Suit.HEARTS, Rank.EIGHT),
      ];

      const evaluation = evaluator.evaluateHand(hand);

      expect(evaluation.overallStrength).toBeGreaterThan(30);
      expect(evaluation.overallStrength).toBeLessThan(70);
      expect(evaluation.pointCards).toBeGreaterThan(15); // Q(2) + 10(10) + A(4) + K(3) = 19
    });
  });

  describe("trump strength evaluation", () => {
    it("should correctly evaluate trump strength with joker", () => {
      const hand = [
        new Card(null, Rank.JOKER),
        new Card(Suit.HEARTS, Rank.KING),
        new Card(Suit.HEARTS, Rank.QUEEN),
        new Card(Suit.SPADES, Rank.ACE),
        new Card(Suit.CLUBS, Rank.TEN),
        new Card(Suit.DIAMONDS, Rank.NINE),
      ];

      const evaluation = evaluator.evaluateHand(hand);
      const heartsStrength = evaluation.trumpStrength.get(Suit.HEARTS);

      expect(heartsStrength).toBeGreaterThan(50); // Should be strong with joker + 2 trump
      expect(evaluation.specialCards.joker).toBe(true);
    });

    it("should correctly identify off-jack trump strength", () => {
      const hand = [
        new Card(Suit.HEARTS, Rank.JACK), // Jack of trump
        new Card(Suit.DIAMONDS, Rank.JACK), // Off-jack (red)
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.CLUBS, Rank.QUEEN),
        new Card(Suit.HEARTS, Rank.TEN),
      ];

      const evaluation = evaluator.evaluateHand(hand);
      const heartsStrength = evaluation.trumpStrength.get(Suit.HEARTS);

      expect(heartsStrength).toBeGreaterThan(60); // Strong with jack + off-jack + ace + ten
      expect(evaluation.specialCards.jacks).toContain(Suit.HEARTS);
      expect(evaluation.specialCards.jacks).toContain(Suit.DIAMONDS);
    });

    it("should not consider wrong color jack as off-jack", () => {
      const hand = [
        new Card(Suit.HEARTS, Rank.JACK), // Jack of trump
        new Card(Suit.CLUBS, Rank.JACK), // Wrong color (black vs red)
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.QUEEN),
        new Card(Suit.HEARTS, Rank.TEN),
      ];

      const evaluation = evaluator.evaluateHand(hand);
      const heartsStrength = evaluation.trumpStrength.get(Suit.HEARTS);
      const clubsStrength = evaluation.trumpStrength.get(Suit.CLUBS);

      // Hearts should be strong (jack + ace + ten)
      expect(heartsStrength).toBeGreaterThan(45);
      // Clubs should be weaker (just the jack)
      expect(clubsStrength).toBeDefined();
      expect(heartsStrength).toBeDefined();
      if (clubsStrength !== undefined && heartsStrength !== undefined) {
        expect(clubsStrength).toBeLessThan(heartsStrength);
      }
    });
  });

  describe("point card counting", () => {
    it("should correctly count all point cards", () => {
      const hand = [
        new Card(Suit.HEARTS, Rank.JACK), // 1 point
        new Card(Suit.SPADES, Rank.QUEEN), // 2 points
        new Card(Suit.CLUBS, Rank.KING), // 3 points
        new Card(Suit.DIAMONDS, Rank.ACE), // 4 points
        new Card(Suit.HEARTS, Rank.TEN), // 10 points
        new Card(Suit.SPADES, Rank.NINE), // 0 points
      ];

      const evaluation = evaluator.evaluateHand(hand);

      expect(evaluation.pointCards).toBe(20); // 1+2+3+4+10
    });

    it("should handle hands with no point cards", () => {
      const hand = [
        new Card(Suit.HEARTS, Rank.TWO),
        new Card(Suit.SPADES, Rank.THREE),
        new Card(Suit.CLUBS, Rank.FOUR),
        new Card(Suit.DIAMONDS, Rank.FIVE),
        new Card(Suit.HEARTS, Rank.SIX),
        new Card(Suit.SPADES, Rank.SEVEN),
      ];

      const evaluation = evaluator.evaluateHand(hand);

      expect(evaluation.pointCards).toBe(0);
    });

    it("should handle joker point value correctly", () => {
      const hand = [
        new Card(null, Rank.JOKER), // Joker has 0 point value in small points
        new Card(Suit.HEARTS, Rank.TEN), // 10 points
        new Card(Suit.SPADES, Rank.ACE), // 4 points
        new Card(Suit.CLUBS, Rank.TWO), // 0 points
        new Card(Suit.DIAMONDS, Rank.THREE), // 0 points
        new Card(Suit.HEARTS, Rank.FOUR), // 0 points
      ];

      const evaluation = evaluator.evaluateHand(hand);

      expect(evaluation.pointCards).toBe(14); // 0+10+4+0+0+0
    });
  });

  describe("special card identification", () => {
    it("should identify joker correctly", () => {
      const hand = [
        new Card(null, Rank.JOKER),
        new Card(Suit.HEARTS, Rank.KING),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.JACK),
        new Card(Suit.DIAMONDS, Rank.TEN),
        new Card(Suit.HEARTS, Rank.NINE),
      ];

      const evaluation = evaluator.evaluateHand(hand);

      expect(evaluation.specialCards.joker).toBe(true);
      expect(evaluation.specialCards.jacks).toEqual([Suit.CLUBS]);
    });

    it("should identify all jacks correctly", () => {
      const hand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.SPADES, Rank.JACK),
        new Card(Suit.CLUBS, Rank.JACK),
        new Card(Suit.DIAMONDS, Rank.QUEEN),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.NINE),
      ];

      const evaluation = evaluator.evaluateHand(hand);

      expect(evaluation.specialCards.joker).toBe(false);
      expect(evaluation.specialCards.jacks).toHaveLength(3);
      expect(evaluation.specialCards.jacks).toContain(Suit.HEARTS);
      expect(evaluation.specialCards.jacks).toContain(Suit.SPADES);
      expect(evaluation.specialCards.jacks).toContain(Suit.CLUBS);
    });

    it("should handle hands with no special cards", () => {
      const hand = [
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.CLUBS, Rank.QUEEN),
        new Card(Suit.DIAMONDS, Rank.TEN),
        new Card(Suit.HEARTS, Rank.NINE),
        new Card(Suit.SPADES, Rank.EIGHT),
      ];

      const evaluation = evaluator.evaluateHand(hand);

      expect(evaluation.specialCards.joker).toBe(false);
      expect(evaluation.specialCards.jacks).toHaveLength(0);
    });
  });

  describe("trick potential estimation", () => {
    it("should estimate high trick potential for strong trump hands", () => {
      const hand = [
        new Card(null, Rank.JOKER),
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.DIAMONDS, Rank.JACK), // Off-jack
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.KING),
        new Card(Suit.SPADES, Rank.TEN),
      ];

      const evaluation = evaluator.evaluateHand(hand);
      const heartsTricks = evaluation.trickPotential.get(Suit.HEARTS);

      expect(heartsTricks).toBeGreaterThan(3); // Strong trump should estimate high tricks
    });

    it("should estimate low trick potential for weak hands", () => {
      const hand = [
        new Card(Suit.SPADES, Rank.TWO),
        new Card(Suit.CLUBS, Rank.THREE),
        new Card(Suit.DIAMONDS, Rank.FOUR),
        new Card(Suit.HEARTS, Rank.FIVE),
        new Card(Suit.SPADES, Rank.SIX),
        new Card(Suit.CLUBS, Rank.SEVEN),
      ];

      const evaluation = evaluator.evaluateHand(hand);

      // All suits should have low trick potential
      for (const tricks of evaluation.trickPotential.values()) {
        expect(tricks).toBeLessThan(2);
      }
    });
  });

  describe("getBestTrumpSuit", () => {
    it("should identify the best trump suit", () => {
      const hand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.KING),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.TEN),
        new Card(Suit.DIAMONDS, Rank.NINE),
      ];

      const result = evaluator.getBestTrumpSuit(hand);

      expect(result.suit).toBe(Suit.HEARTS); // Should choose hearts with jack+ace+king
      expect(result.strength).toBeGreaterThan(50);
    });

    it("should handle tie-breaking between suits", () => {
      // Create a hand where multiple suits have similar strength
      const hand = [
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.KING),
        new Card(Suit.SPADES, Rank.ACE),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.TEN),
        new Card(Suit.DIAMONDS, Rank.NINE),
      ];

      const result = evaluator.getBestTrumpSuit(hand);

      expect([Suit.HEARTS, Suit.SPADES]).toContain(result.suit);
      expect(result.strength).toBeGreaterThan(20);
    });
  });

  describe("edge cases", () => {
    it("should handle empty hands gracefully", () => {
      const hand: Card[] = [];

      const evaluation = evaluator.evaluateHand(hand);

      expect(evaluation.overallStrength).toBe(0);
      expect(evaluation.pointCards).toBe(0);
      expect(evaluation.specialCards.joker).toBe(false);
      expect(evaluation.specialCards.jacks).toHaveLength(0);
    });

    it("should handle single card hands", () => {
      const hand = [new Card(Suit.HEARTS, Rank.ACE)];

      const evaluation = evaluator.evaluateHand(hand);

      expect(evaluation.overallStrength).toBeGreaterThan(0);
      expect(evaluation.pointCards).toBe(4);
      expect(evaluation.trumpStrength.get(Suit.HEARTS)).toBeGreaterThan(0);
    });

    it("should handle all joker hands", () => {
      // This shouldn't happen in real game, but test robustness
      const hand = [new Card(null, Rank.JOKER)];

      const evaluation = evaluator.evaluateHand(hand);

      expect(evaluation.specialCards.joker).toBe(true);
      expect(evaluation.overallStrength).toBeGreaterThan(20); // Joker should have decent strength
    });

    it("should cap trump strength at 100", () => {
      // Create an impossibly strong hand to test capping
      const hand = [
        new Card(null, Rank.JOKER),
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.DIAMONDS, Rank.JACK),
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.KING),
        new Card(Suit.HEARTS, Rank.QUEEN),
      ];

      const evaluation = evaluator.evaluateHand(hand);
      const heartsStrength = evaluation.trumpStrength.get(Suit.HEARTS);

      expect(heartsStrength).toBeLessThanOrEqual(100);
      expect(evaluation.overallStrength).toBeLessThanOrEqual(100);
    });
  });

  describe("performance", () => {
    it("should evaluate hands within performance target", () => {
      const hand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.DIAMONDS, Rank.JACK),
        new Card(null, Rank.JOKER),
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.CLUBS, Rank.TEN),
      ];

      const startTime = performance.now();

      // Run evaluation multiple times to test performance
      for (let i = 0; i < 100; i++) {
        evaluator.evaluateHand(hand);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 100;

      expect(avgTime).toBeLessThan(10); // Should be well under 100ms target
    });
  });

  describe("integration with actual card functionality", () => {
    it("should work correctly with Card class trump methods", () => {
      const hand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.DIAMONDS, Rank.JACK), // Should be off-jack for hearts
        new Card(null, Rank.JOKER),
        new Card(Suit.CLUBS, Rank.ACE),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.HEARTS, Rank.TEN),
      ];

      const evaluation = evaluator.evaluateHand(hand);

      // Verify that off-jack detection works with actual Card methods
      const diamondJack = hand[1];
      expect(diamondJack.isOffJack(Suit.HEARTS)).toBe(true);
      expect(diamondJack.isTrump(Suit.HEARTS)).toBe(true);

      // Should reflect in evaluation
      const heartsStrength = evaluation.trumpStrength.get(Suit.HEARTS);
      expect(heartsStrength).toBeGreaterThan(60); // Should be strong with jack, off-jack, joker, ten
    });
  });
});
