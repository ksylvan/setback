import { beforeEach, describe, expect, it } from "vitest";
import { Card } from "@/entities/Card";
import { type GameState, type Partnership, type Player, Rank, Suit } from "@/types/game";
import { BiddingAI } from "./BiddingAI";

describe("BiddingAI Setback Rules Validation", () => {
  let biddingAI: BiddingAI;
  let baseGameState: GameState;

  beforeEach(() => {
    biddingAI = new BiddingAI();

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
      { id: "partnership2", player1Id: "player2", player2Id: "player4", score: 10 },
    ];

    baseGameState = {
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

  describe("Setback bidding fundamentals", () => {
    it("should follow the rule: bid 2 with jack and off-jack", () => {
      const jackOffJackHand = [
        new Card(Suit.HEARTS, Rank.JACK), // Jack of trump
        new Card(Suit.DIAMONDS, Rank.JACK), // Off-jack (same color)
        new Card(Suit.SPADES, Rank.TWO),
        new Card(Suit.CLUBS, Rank.THREE),
        new Card(Suit.DIAMONDS, Rank.FOUR),
        new Card(Suit.HEARTS, Rank.FIVE),
      ];

      let bidCount = 0;
      let bidTotal = 0;

      for (let i = 0; i < 30; i++) {
        const bid = biddingAI.calculateBid(jackOffJackHand, baseGameState);
        if (bid !== null) {
          bidCount++;
          bidTotal += bid;
          expect(bid).toBeGreaterThanOrEqual(2); // Should at least bid minimum
        }
      }

      // Should bid most of the time with jack + off-jack
      expect(bidCount).toBeGreaterThan(20);

      if (bidCount > 0) {
        const avgBid = bidTotal / bidCount;
        expect(avgBid).toBeGreaterThanOrEqual(2);
        expect(avgBid).toBeLessThanOrEqual(3.5); // Usually conservative with just jacks
      }
    });

    it("should bid aggressively with joker + jack", () => {
      const jokerJackHand = [
        new Card(null, Rank.JOKER), // Highest trump
        new Card(Suit.HEARTS, Rank.JACK), // Jack of trump
        new Card(Suit.SPADES, Rank.TWO),
        new Card(Suit.CLUBS, Rank.THREE),
        new Card(Suit.DIAMONDS, Rank.FOUR),
        new Card(Suit.HEARTS, Rank.FIVE),
      ];

      let bidCount = 0;
      let bidTotal = 0;

      for (let i = 0; i < 30; i++) {
        const bid = biddingAI.calculateBid(jokerJackHand, baseGameState);
        if (bid !== null) {
          bidCount++;
          bidTotal += bid;
        }
      }

      // Should almost always bid with joker + jack
      expect(bidCount).toBeGreaterThan(25);

      if (bidCount > 0) {
        const avgBid = bidTotal / bidCount;
        expect(avgBid).toBeGreaterThan(2.5); // Should bid higher than minimum
      }
    });

    it("should recognize the value of long trump suits", () => {
      const longTrumpHand = [
        new Card(Suit.HEARTS, Rank.JACK), // Jack of trump
        new Card(Suit.HEARTS, Rank.ACE), // High trump
        new Card(Suit.HEARTS, Rank.KING), // Trump
        new Card(Suit.HEARTS, Rank.QUEEN), // Trump
        new Card(Suit.HEARTS, Rank.TEN), // Trump
        new Card(Suit.HEARTS, Rank.NINE), // Trump (6 hearts total)
      ];

      const shortTrumpHand = [
        new Card(Suit.HEARTS, Rank.JACK), // Jack of trump
        new Card(Suit.HEARTS, Rank.ACE), // High trump
        new Card(Suit.SPADES, Rank.KING), // Off-suit
        new Card(Suit.CLUBS, Rank.QUEEN), // Off-suit
        new Card(Suit.DIAMONDS, Rank.TEN), // Off-suit
        new Card(Suit.SPADES, Rank.NINE), // Off-suit (2 hearts)
      ];

      let longTrumpBids = 0;
      let shortTrumpBids = 0;
      let longTrumpTotal = 0;
      let shortTrumpTotal = 0;

      for (let i = 0; i < 30; i++) {
        const longBid = biddingAI.calculateBid(longTrumpHand, baseGameState);
        const shortBid = biddingAI.calculateBid(shortTrumpHand, baseGameState);

        if (longBid !== null) {
          longTrumpBids++;
          longTrumpTotal += longBid;
        }
        if (shortBid !== null) {
          shortTrumpBids++;
          shortTrumpTotal += shortBid;
        }
      }

      // Long trump should bid more often and higher
      expect(longTrumpBids).toBeGreaterThanOrEqual(shortTrumpBids);

      if (longTrumpBids > 0 && shortTrumpBids > 0) {
        const avgLongBid = longTrumpTotal / longTrumpBids;
        const avgShortBid = shortTrumpTotal / shortTrumpBids;
        expect(avgLongBid).toBeGreaterThan(avgShortBid);
      }
    });

    it("should value point cards (game points) appropriately", () => {
      const highPointsHand = [
        new Card(Suit.HEARTS, Rank.JACK), // 1 point + trump
        new Card(Suit.SPADES, Rank.ACE), // 4 points
        new Card(Suit.CLUBS, Rank.KING), // 3 points
        new Card(Suit.DIAMONDS, Rank.QUEEN), // 2 points
        new Card(Suit.HEARTS, Rank.TEN), // 10 points
        new Card(Suit.SPADES, Rank.TWO), // 0 points (20 total)
      ];

      const lowPointsHand = [
        new Card(Suit.HEARTS, Rank.JACK), // 1 point + trump
        new Card(Suit.SPADES, Rank.TWO), // 0 points
        new Card(Suit.CLUBS, Rank.THREE), // 0 points
        new Card(Suit.DIAMONDS, Rank.FOUR), // 0 points
        new Card(Suit.HEARTS, Rank.FIVE), // 0 points
        new Card(Suit.SPADES, Rank.SIX), // 0 points (1 total)
      ];

      let highPointsBids = 0;
      let lowPointsBids = 0;

      for (let i = 0; i < 30; i++) {
        if (biddingAI.calculateBid(highPointsHand, baseGameState) !== null) highPointsBids++;
        if (biddingAI.calculateBid(lowPointsHand, baseGameState) !== null) lowPointsBids++;
      }

      // High point cards should increase bidding frequency
      expect(highPointsBids).toBeGreaterThanOrEqual(lowPointsBids);
    });
  });

  describe("Advanced Setback strategy validation", () => {
    it("should avoid bidding with scattered suits and no trump strength", () => {
      const scatteredHand = [
        new Card(Suit.HEARTS, Rank.TWO), // No trump strength
        new Card(Suit.SPADES, Rank.THREE), // Different suits
        new Card(Suit.CLUBS, Rank.FOUR), // All low cards
        new Card(Suit.DIAMONDS, Rank.FIVE), // No coordination
        new Card(Suit.HEARTS, Rank.SIX),
        new Card(Suit.SPADES, Rank.SEVEN),
      ];

      let passes = 0;
      for (let i = 0; i < 30; i++) {
        const bid = biddingAI.calculateBid(scatteredHand, baseGameState);
        if (bid === null) passes++;
      }

      // Should pass most of the time with terrible hand
      expect(passes).toBeGreaterThan(25);
    });

    it("should recognize balanced vs. unbalanced hand patterns", () => {
      const balancedHand = [
        new Card(Suit.HEARTS, Rank.JACK), // Some trump
        new Card(Suit.SPADES, Rank.QUEEN), // Some high cards
        new Card(Suit.CLUBS, Rank.KING), // Across suits
        new Card(Suit.DIAMONDS, Rank.TEN), // Balanced strength
        new Card(Suit.HEARTS, Rank.NINE),
        new Card(Suit.SPADES, Rank.EIGHT),
      ];

      const unbalancedHand = [
        new Card(Suit.HEARTS, Rank.JACK), // All hearts
        new Card(Suit.HEARTS, Rank.ACE), // Very unbalanced
        new Card(Suit.HEARTS, Rank.KING), // but strong in trump
        new Card(Suit.HEARTS, Rank.QUEEN),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.TWO), // One off-suit
      ];

      let balancedBids = 0;
      let unbalancedBids = 0;
      let balancedTotal = 0;
      let unbalancedTotal = 0;

      for (let i = 0; i < 30; i++) {
        const balancedBid = biddingAI.calculateBid(balancedHand, baseGameState);
        const unbalancedBid = biddingAI.calculateBid(unbalancedHand, baseGameState);

        if (balancedBid !== null) {
          balancedBids++;
          balancedTotal += balancedBid;
        }
        if (unbalancedBid !== null) {
          unbalancedBids++;
          unbalancedTotal += unbalancedBid;
        }
      }

      // Unbalanced hand with trump strength should bid more aggressively
      expect(unbalancedBids).toBeGreaterThanOrEqual(balancedBids);

      if (unbalancedBids > 0 && balancedBids > 0) {
        const avgUnbalanced = unbalancedTotal / unbalancedBids;
        const avgBalanced = balancedTotal / balancedBids;
        expect(avgUnbalanced).toBeGreaterThanOrEqual(avgBalanced);
      }
    });

    it("should handle borderline bidding hands correctly", () => {
      // Hands that are on the edge of being biddable
      const borderlineHands = [
        // Weak trump but some points
        [
          new Card(Suit.HEARTS, Rank.QUEEN),
          new Card(Suit.HEARTS, Rank.TEN), // 10 points
          new Card(Suit.SPADES, Rank.ACE), // 4 points
          new Card(Suit.CLUBS, Rank.KING), // 3 points
          new Card(Suit.DIAMONDS, Rank.TWO),
          new Card(Suit.HEARTS, Rank.THREE),
        ],
        // Strong trump but few points
        [
          new Card(Suit.HEARTS, Rank.JACK),
          new Card(Suit.HEARTS, Rank.ACE),
          new Card(Suit.HEARTS, Rank.KING),
          new Card(Suit.SPADES, Rank.TWO),
          new Card(Suit.CLUBS, Rank.THREE),
          new Card(Suit.DIAMONDS, Rank.FOUR),
        ],
        // Off-jack but weak otherwise
        [
          new Card(Suit.HEARTS, Rank.JACK),
          new Card(Suit.DIAMONDS, Rank.JACK), // Off-jack
          new Card(Suit.SPADES, Rank.TWO),
          new Card(Suit.CLUBS, Rank.THREE),
          new Card(Suit.DIAMONDS, Rank.FOUR),
          new Card(Suit.HEARTS, Rank.FIVE),
        ],
      ];

      for (const hand of borderlineHands) {
        let bids = 0;

        for (let i = 0; i < 30; i++) {
          const bid = biddingAI.calculateBid(hand, baseGameState);
          if (bid !== null) {
            bids++;
            expect(bid).toBeGreaterThanOrEqual(2);
            expect(bid).toBeLessThanOrEqual(4); // Shouldn't bid too high with borderline hands
          }
        }

        // Borderline hands should show mixed behavior (sometimes bid, sometimes pass)
        expect(bids).toBeGreaterThan(3); // Not always pass
        expect(bids).toBeLessThan(30); // Not always bid
      }
    });
  });

  describe("Bidding rule compliance", () => {
    it("should never bid less than minimum (2)", () => {
      const testHands = [
        // Various hand strengths
        [
          new Card(Suit.HEARTS, Rank.TWO),
          new Card(Suit.SPADES, Rank.THREE),
          new Card(Suit.CLUBS, Rank.FOUR),
          new Card(Suit.DIAMONDS, Rank.FIVE),
          new Card(Suit.HEARTS, Rank.SIX),
          new Card(Suit.SPADES, Rank.SEVEN),
        ],
        [
          new Card(Suit.HEARTS, Rank.JACK),
          new Card(Suit.SPADES, Rank.QUEEN),
          new Card(Suit.CLUBS, Rank.KING),
          new Card(Suit.DIAMONDS, Rank.ACE),
          new Card(Suit.HEARTS, Rank.TEN),
          new Card(Suit.SPADES, Rank.NINE),
        ],
        [
          new Card(null, Rank.JOKER),
          new Card(Suit.HEARTS, Rank.JACK),
          new Card(Suit.DIAMONDS, Rank.JACK),
          new Card(Suit.HEARTS, Rank.ACE),
          new Card(Suit.HEARTS, Rank.KING),
          new Card(Suit.HEARTS, Rank.TEN),
        ],
      ];

      for (const hand of testHands) {
        for (let i = 0; i < 20; i++) {
          const bid = biddingAI.calculateBid(hand, baseGameState);
          if (bid !== null) {
            expect(bid).toBeGreaterThanOrEqual(2);
            expect(bid).toBeLessThanOrEqual(6);
          }
        }
      }
    });

    it("should never bid higher than maximum (6)", () => {
      // Even with the strongest possible hand
      const perfectHand = [
        new Card(null, Rank.JOKER),
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.DIAMONDS, Rank.JACK),
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.KING),
        new Card(Suit.HEARTS, Rank.TEN),
      ];

      for (let i = 0; i < 50; i++) {
        const bid = biddingAI.calculateBid(perfectHand, baseGameState);
        if (bid !== null) {
          expect(bid).toBeLessThanOrEqual(6);
        }
      }
    });

    it("should respect current bid when making counter-bids", () => {
      const competitiveHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.KING),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.TEN),
        new Card(Suit.DIAMONDS, Rank.NINE),
      ];

      // Test against different current bid levels
      for (let currentBidAmount = 2; currentBidAmount <= 5; currentBidAmount++) {
        baseGameState.currentHand.currentBid = {
          playerId: "opponent",
          amount: currentBidAmount,
          passed: false,
        };

        for (let i = 0; i < 20; i++) {
          const bid = biddingAI.calculateBid(competitiveHand, baseGameState);
          if (bid !== null) {
            expect(bid).toBeGreaterThan(currentBidAmount);
          }
        }
      }
    });

    it("should handle end-of-bidding scenarios correctly", () => {
      const mediumHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.NINE),
      ];

      // Current bid is already at 6 (maximum)
      baseGameState.currentHand.currentBid = { playerId: "opponent", amount: 6, passed: false };

      // Should not be able to bid higher than 6
      for (let i = 0; i < 20; i++) {
        const bid = biddingAI.calculateBid(mediumHand, baseGameState);
        expect(bid).toBeNull(); // Must pass when bid is already at maximum
      }
    });
  });

  describe("Logical consistency checks", () => {
    it("should show correlation between hand strength and bid frequency", () => {
      const handStrengths = {
        veryWeak: [
          new Card(Suit.SPADES, Rank.TWO),
          new Card(Suit.CLUBS, Rank.THREE),
          new Card(Suit.DIAMONDS, Rank.FOUR),
          new Card(Suit.HEARTS, Rank.FIVE),
          new Card(Suit.SPADES, Rank.SIX),
          new Card(Suit.CLUBS, Rank.SEVEN),
        ],
        weak: [
          new Card(Suit.HEARTS, Rank.NINE),
          new Card(Suit.SPADES, Rank.EIGHT),
          new Card(Suit.CLUBS, Rank.SEVEN),
          new Card(Suit.DIAMONDS, Rank.SIX),
          new Card(Suit.HEARTS, Rank.FIVE),
          new Card(Suit.SPADES, Rank.FOUR),
        ],
        medium: [
          new Card(Suit.HEARTS, Rank.QUEEN),
          new Card(Suit.SPADES, Rank.KING),
          new Card(Suit.CLUBS, Rank.ACE),
          new Card(Suit.DIAMONDS, Rank.TEN),
          new Card(Suit.HEARTS, Rank.NINE),
          new Card(Suit.SPADES, Rank.EIGHT),
        ],
        strong: [
          new Card(Suit.HEARTS, Rank.JACK),
          new Card(Suit.HEARTS, Rank.ACE),
          new Card(Suit.HEARTS, Rank.KING),
          new Card(Suit.SPADES, Rank.QUEEN),
          new Card(Suit.CLUBS, Rank.TEN),
          new Card(Suit.DIAMONDS, Rank.NINE),
        ],
        veryStrong: [
          new Card(null, Rank.JOKER),
          new Card(Suit.HEARTS, Rank.JACK),
          new Card(Suit.DIAMONDS, Rank.JACK),
          new Card(Suit.HEARTS, Rank.ACE),
          new Card(Suit.HEARTS, Rank.KING),
          new Card(Suit.HEARTS, Rank.TEN),
        ],
      };

      const bidRates: { [strength: string]: number } = {};

      for (const [strength, hand] of Object.entries(handStrengths)) {
        let bids = 0;
        for (let i = 0; i < 50; i++) {
          if (biddingAI.calculateBid(hand, baseGameState) !== null) {
            bids++;
          }
        }
        bidRates[strength] = bids / 50;
      }

      // Should show clear progression from weak to strong
      expect(bidRates.veryWeak).toBeLessThanOrEqual(bidRates.weak);
      expect(bidRates.weak).toBeLessThanOrEqual(bidRates.medium);
      expect(bidRates.medium).toBeLessThanOrEqual(bidRates.strong);
      expect(bidRates.strong).toBeLessThanOrEqual(bidRates.veryStrong);

      // Very strong hands should bid almost always
      expect(bidRates.veryStrong).toBeGreaterThan(0.8);

      // Very weak hands should rarely bid
      expect(bidRates.veryWeak).toBeLessThan(0.2);
    });

    it("should make decisions within acceptable time limits consistently", () => {
      const testHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.NINE),
      ];

      const times: number[] = [];

      // Test decision speed over multiple calls
      for (let i = 0; i < 50; i++) {
        const start = performance.now();
        biddingAI.calculateBid(testHand, baseGameState);
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      // Performance requirements
      expect(avgTime).toBeLessThan(50); // Average under 50ms
      expect(maxTime).toBeLessThan(200); // No single decision over 200ms

      // Consistency check - no huge variations
      const stdDev = Math.sqrt(times.reduce((sum, time) => sum + (time - avgTime) ** 2, 0) / times.length);
      expect(stdDev).toBeLessThan(30); // Standard deviation under 30ms
    });
  });
});
