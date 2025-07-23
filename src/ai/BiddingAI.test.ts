import { beforeEach, describe, expect, it } from "vitest";
import { Card } from "@/entities/Card";
import { AIPersonality, type GameState, type Partnership, type Player, Rank, Suit } from "@/types/game";
import { BiddingAI } from "./BiddingAI";

describe("BiddingAI", () => {
  let biddingAI: BiddingAI;
  let mockGameState: GameState;

  beforeEach(() => {
    biddingAI = new BiddingAI();

    // Create mock game state
    const players: Player[] = [
      {
        id: "player1",
        name: "Player 1",
        hand: [],
        position: "north" as any,
        partnerId: "player3",
        isHuman: false,
        isDealer: false,
      },
      {
        id: "player2",
        name: "Player 2",
        hand: [],
        position: "east" as any,
        partnerId: "player4",
        isHuman: false,
        isDealer: false,
      },
      {
        id: "player3",
        name: "Player 3",
        hand: [],
        position: "south" as any,
        partnerId: "player1",
        isHuman: false,
        isDealer: false,
      },
      {
        id: "player4",
        name: "Player 4",
        hand: [],
        position: "west" as any,
        partnerId: "player2",
        isHuman: false,
        isDealer: true,
      },
    ];

    const partnerships: Partnership[] = [
      { id: "partnership1", player1Id: "player1", player2Id: "player3", score: 10 },
      { id: "partnership2", player1Id: "player2", player2Id: "player4", score: 8 },
    ];

    mockGameState = {
      players,
      partnerships,
      currentHand: {
        trumpSuit: null,
        currentBid: null,
        biddingPhase: true,
        currentPlayerIndex: 0,
        tricks: [],
        currentTrick: null,
        bids: [],
      },
      deck: [],
      gamePhase: "bidding" as any,
      winner: null,
    };
  });

  describe("calculateBid", () => {
    it("should return null for very weak hands", () => {
      const weakHand = [
        new Card(Suit.SPADES, Rank.TWO),
        new Card(Suit.CLUBS, Rank.THREE),
        new Card(Suit.DIAMONDS, Rank.FOUR),
        new Card(Suit.HEARTS, Rank.FIVE),
        new Card(Suit.SPADES, Rank.SIX),
        new Card(Suit.CLUBS, Rank.SEVEN),
      ];

      const bid = biddingAI.calculateBid(weakHand, mockGameState);
      expect(bid).toBeNull();
    });

    it("should bid on strong hands", () => {
      const strongHand = [
        new Card(null, Rank.JOKER),
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.DIAMONDS, Rank.JACK), // Off-jack for hearts
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.KING),
        new Card(Suit.HEARTS, Rank.TEN),
      ];

      const bid = biddingAI.calculateBid(strongHand, mockGameState);
      expect(bid).toBeGreaterThanOrEqual(2);
      expect(bid).toBeLessThanOrEqual(6);
    });

    it("should respect current bid when bidding", () => {
      mockGameState.currentHand.currentBid = { playerId: "player2", amount: 4, passed: false };

      const mediumHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.CLUBS, Rank.QUEEN),
        new Card(Suit.DIAMONDS, Rank.TEN),
        new Card(Suit.HEARTS, Rank.NINE),
      ];

      const bid = biddingAI.calculateBid(mediumHand, mockGameState);

      if (bid !== null) {
        expect(bid).toBeGreaterThan(4); // Must be higher than current bid
      }
    });

    it("should make decisions within performance target", () => {
      const hand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.DIAMONDS, Rank.JACK),
        new Card(null, Rank.JOKER),
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.CLUBS, Rank.TEN),
      ];

      const startTime = performance.now();

      // Run multiple bidding decisions to test performance
      for (let i = 0; i < 50; i++) {
        biddingAI.calculateBid(hand, mockGameState);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 50;

      expect(avgTime).toBeLessThan(50); // Should be well under 500ms target
    });
  });

  describe("personality adjustments", () => {
    it("should bid more conservatively with CONSERVATIVE personality", () => {
      const mediumHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.HEARTS, Rank.QUEEN),
        new Card(Suit.SPADES, Rank.ACE),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.TEN),
        new Card(Suit.HEARTS, Rank.NINE),
      ];

      const conservativeBid = biddingAI.calculateBid(mediumHand, mockGameState, AIPersonality.CONSERVATIVE);
      const balancedBid = biddingAI.calculateBid(mediumHand, mockGameState, AIPersonality.BALANCED);

      // Conservative should be more likely to pass or bid lower
      if (conservativeBid !== null && balancedBid !== null) {
        expect(conservativeBid).toBeLessThanOrEqual(balancedBid);
      }
    });

    it("should bid more aggressively with AGGRESSIVE personality", () => {
      const mediumHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.HEARTS, Rank.QUEEN),
        new Card(Suit.SPADES, Rank.ACE),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.TEN),
        new Card(Suit.HEARTS, Rank.NINE),
      ];

      let aggressiveBids = 0;
      let conservativeBids = 0;

      // Run multiple times due to randomization
      for (let i = 0; i < 20; i++) {
        const aggressiveBid = biddingAI.calculateBid(mediumHand, mockGameState, AIPersonality.AGGRESSIVE);
        const conservativeBid = biddingAI.calculateBid(mediumHand, mockGameState, AIPersonality.CONSERVATIVE);

        if (aggressiveBid !== null) aggressiveBids++;
        if (conservativeBid !== null) conservativeBids++;
      }

      // Aggressive should bid more often than conservative
      expect(aggressiveBids).toBeGreaterThanOrEqual(conservativeBids);
    });
  });

  describe("positional adjustments", () => {
    it("should be more likely to bid when dealer is stuck", () => {
      // Set current player as dealer
      mockGameState.currentHand.currentPlayerIndex = 3; // player4 is dealer

      // Mock that all other players have passed
      mockGameState.currentHand.bids = [
        { playerId: "player1", amount: 0, passed: true },
        { playerId: "player2", amount: 0, passed: true },
        { playerId: "player3", amount: 0, passed: true },
      ];

      const mediumHand = [
        new Card(Suit.HEARTS, Rank.QUEEN),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.CLUBS, Rank.ACE),
        new Card(Suit.DIAMONDS, Rank.TEN),
        new Card(Suit.HEARTS, Rank.NINE),
        new Card(Suit.SPADES, Rank.EIGHT),
      ];

      const bid = biddingAI.calculateBid(mediumHand, mockGameState);

      // Dealer should be more likely to bid when stuck
      expect(bid).toBeGreaterThanOrEqual(2);
    });
  });

  describe("game score adjustments", () => {
    it("should bid more aggressively when behind in score", () => {
      // Set current partnership behind
      mockGameState.partnerships[0].score = 5; // Current player's partnership
      mockGameState.partnerships[1].score = 15; // Opponent partnership

      const mediumHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.NINE),
      ];

      let bidsWhenBehind = 0;

      // Run multiple times due to randomization
      for (let i = 0; i < 10; i++) {
        const bid = biddingAI.calculateBid(mediumHand, mockGameState);
        if (bid !== null) bidsWhenBehind++;
      }

      // Should bid more often when behind
      expect(bidsWhenBehind).toBeGreaterThan(5);
    });

    it("should bid more conservatively when ahead and close to winning", () => {
      // Set current partnership ahead and close to winning
      mockGameState.partnerships[0].score = 19; // Current player's partnership
      mockGameState.partnerships[1].score = 10; // Opponent partnership

      const mediumHand = [
        new Card(Suit.HEARTS, Rank.QUEEN),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.CLUBS, Rank.ACE),
        new Card(Suit.DIAMONDS, Rank.TEN),
        new Card(Suit.HEARTS, Rank.NINE),
        new Card(Suit.SPADES, Rank.EIGHT),
      ];

      let bidsWhenAhead = 0;

      // Run multiple times due to randomization
      for (let i = 0; i < 10; i++) {
        const bid = biddingAI.calculateBid(mediumHand, mockGameState);
        if (bid !== null) bidsWhenAhead++;
      }

      // Should bid less often when ahead and close to winning
      expect(bidsWhenAhead).toBeLessThan(8);
    });
  });

  describe("performance tracking", () => {
    it("should track performance statistics", () => {
      const hand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.NINE),
      ];

      biddingAI.resetPerformanceStats();

      // Make some bidding decisions
      for (let i = 0; i < 5; i++) {
        biddingAI.calculateBid(hand, mockGameState);
      }

      const stats = biddingAI.getPerformanceStats();

      expect(stats.calls).toBe(5);
      expect(stats.averageDecisionTime).toBeGreaterThan(0);
      expect(stats.decisionTime).toBeGreaterThan(0);
    });

    it("should reset performance statistics correctly", () => {
      const hand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.NINE),
      ];

      // Make some decisions
      biddingAI.calculateBid(hand, mockGameState);
      biddingAI.calculateBid(hand, mockGameState);

      // Reset stats
      biddingAI.resetPerformanceStats();

      const stats = biddingAI.getPerformanceStats();

      expect(stats.calls).toBe(0);
      expect(stats.averageDecisionTime).toBe(0);
      expect(stats.decisionTime).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("should handle empty hands gracefully", () => {
      const emptyHand: Card[] = [];

      const bid = biddingAI.calculateBid(emptyHand, mockGameState);
      expect(bid).toBeNull();
    });

    it("should handle maximum bid scenarios", () => {
      mockGameState.currentHand.currentBid = { playerId: "player2", amount: 6, passed: false };

      const strongHand = [
        new Card(null, Rank.JOKER),
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.DIAMONDS, Rank.JACK),
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.KING),
        new Card(Suit.HEARTS, Rank.QUEEN),
      ];

      const bid = biddingAI.calculateBid(strongHand, mockGameState);

      // Cannot bid higher than 6
      expect(bid).toBeNull();
    });

    it("should handle missing partnership data gracefully", () => {
      // Remove partnerships to test error handling
      mockGameState.partnerships = [];

      const mediumHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.NINE),
      ];

      // Should not throw error
      expect(() => {
        biddingAI.calculateBid(mediumHand, mockGameState);
      }).not.toThrow();
    });
  });
});
