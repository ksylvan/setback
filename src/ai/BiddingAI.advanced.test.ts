import { beforeEach, describe, expect, it } from "vitest";
import { Card } from "@/entities/Card";
import { AIPersonality, type GameState, type Partnership, type Player, Rank, Suit } from "@/types/game";
import { BiddingAI } from "./BiddingAI";

describe("BiddingAI Advanced Algorithm Tests", () => {
  let biddingAI: BiddingAI;
  let baseGameState: GameState;

  beforeEach(() => {
    biddingAI = new BiddingAI();

    const players: Player[] = [
      {
        id: "player1",
        name: "AI Player 1",
        hand: [],
        position: "north" as any,
        partnerId: "player3",
        isHuman: false,
        isDealer: false,
      },
      {
        id: "player2",
        name: "AI Player 2",
        hand: [],
        position: "east" as any,
        partnerId: "player4",
        isHuman: false,
        isDealer: false,
      },
      {
        id: "player3",
        name: "AI Player 3",
        hand: [],
        position: "south" as any,
        partnerId: "player1",
        isHuman: false,
        isDealer: false,
      },
      {
        id: "player4",
        name: "AI Player 4",
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

  describe("Hand strength correlation tests", () => {
    it("should bid higher amounts with stronger hands", () => {
      const weakHand = [
        new Card(Suit.SPADES, Rank.TWO),
        new Card(Suit.CLUBS, Rank.THREE),
        new Card(Suit.DIAMONDS, Rank.FOUR),
        new Card(Suit.HEARTS, Rank.FIVE),
        new Card(Suit.SPADES, Rank.SIX),
        new Card(Suit.CLUBS, Rank.SEVEN),
      ];

      const mediumHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.NINE),
      ];

      const strongHand = [
        new Card(null, Rank.JOKER),
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.DIAMONDS, Rank.JACK), // Off-jack
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.KING),
        new Card(Suit.HEARTS, Rank.TEN),
      ];

      const weakBids: number[] = [];
      const mediumBids: number[] = [];
      const strongBids: number[] = [];

      // Collect multiple samples to account for randomization
      for (let i = 0; i < 50; i++) {
        const weakBid = biddingAI.calculateBid(weakHand, baseGameState);
        const mediumBid = biddingAI.calculateBid(mediumHand, baseGameState);
        const strongBid = biddingAI.calculateBid(strongHand, baseGameState);

        if (weakBid !== null) weakBids.push(weakBid);
        if (mediumBid !== null) mediumBids.push(mediumBid);
        if (strongBid !== null) strongBids.push(strongBid);
      }

      // Strong hands should bid more often
      expect(strongBids.length).toBeGreaterThan(weakBids.length);
      expect(strongBids.length).toBeGreaterThanOrEqual(mediumBids.length);

      // When they do bid, stronger hands should bid higher on average
      if (weakBids.length > 0 && strongBids.length > 0) {
        const avgWeakBid = weakBids.reduce((a, b) => a + b, 0) / weakBids.length;
        const avgStrongBid = strongBids.reduce((a, b) => a + b, 0) / strongBids.length;
        expect(avgStrongBid).toBeGreaterThan(avgWeakBid);
      }
    });

    it("should consider trump potential in different suits", () => {
      // Hand strong in hearts
      const heartsHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.DIAMONDS, Rank.JACK), // Off-jack for hearts
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.KING),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.NINE),
      ];

      // Hand strong in spades
      const spadesHand = [
        new Card(Suit.SPADES, Rank.JACK),
        new Card(Suit.CLUBS, Rank.JACK), // Off-jack for spades
        new Card(Suit.SPADES, Rank.ACE),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.SPADES, Rank.TEN),
        new Card(Suit.HEARTS, Rank.NINE),
      ];

      // Both should be willing to bid similarly (both have strong trump potential)
      let heartsBids = 0;
      let spadesBids = 0;

      for (let i = 0; i < 20; i++) {
        if (biddingAI.calculateBid(heartsHand, baseGameState) !== null) heartsBids++;
        if (biddingAI.calculateBid(spadesHand, baseGameState) !== null) spadesBids++;
      }

      // Both should bid frequently with strong trump potential
      expect(heartsBids).toBeGreaterThan(10);
      expect(spadesBids).toBeGreaterThan(10);

      // Should be within reasonable range of each other
      expect(Math.abs(heartsBids - spadesBids)).toBeLessThan(8);
    });
  });

  describe("Competitive bidding scenarios", () => {
    it("should increase bid amounts when competition is present", () => {
      const competitiveHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.CLUBS, Rank.QUEEN),
        new Card(Suit.DIAMONDS, Rank.TEN),
        new Card(Suit.HEARTS, Rank.NINE),
      ];

      // Scenario 1: No current bid
      baseGameState.currentHand.currentBid = null;
      const initialBids: number[] = [];

      // Scenario 2: Current bid of 3
      const gameStateWithBid = { ...baseGameState };
      gameStateWithBid.currentHand.currentBid = { playerId: "player2", amount: 3, passed: false };
      const competitiveBids: number[] = [];

      for (let i = 0; i < 30; i++) {
        const initialBid = biddingAI.calculateBid(competitiveHand, baseGameState);
        const competitiveBid = biddingAI.calculateBid(competitiveHand, gameStateWithBid);

        if (initialBid !== null) initialBids.push(initialBid);
        if (competitiveBid !== null) competitiveBids.push(competitiveBid);
      }

      // When there's competition, bids should be higher
      if (initialBids.length > 0 && competitiveBids.length > 0) {
        const avgInitial = initialBids.reduce((a, b) => a + b, 0) / initialBids.length;
        const avgCompetitive = competitiveBids.reduce((a, b) => a + b, 0) / competitiveBids.length;

        // Competitive bids must be at least 4 (higher than current bid of 3)
        expect(Math.min(...competitiveBids)).toBeGreaterThanOrEqual(4);
        expect(avgCompetitive).toBeGreaterThanOrEqual(avgInitial);
      }
    });

    it("should handle bidding wars appropriately", () => {
      const strongHand = [
        new Card(null, Rank.JOKER),
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.KING),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.QUEEN),
      ];

      // Test bidding at different levels
      const bidLevels = [2, 3, 4, 5];
      const biddingResults: { [level: number]: number } = {};

      for (const level of bidLevels) {
        baseGameState.currentHand.currentBid = { playerId: "player2", amount: level, passed: false };

        let successfulBids = 0;
        for (let i = 0; i < 20; i++) {
          const bid = biddingAI.calculateBid(strongHand, baseGameState);
          if (bid !== null && bid > level) {
            successfulBids++;
          }
        }
        biddingResults[level] = successfulBids;
      }

      // Should be willing to compete at lower levels more than higher levels
      expect(biddingResults[2]).toBeGreaterThanOrEqual(biddingResults[5]);
      expect(biddingResults[3]).toBeGreaterThanOrEqual(biddingResults[5]);
    });
  });

  describe("Dealer stuck scenarios", () => {
    it("should force dealer to bid when all others pass", () => {
      const dealerHand = [
        new Card(Suit.HEARTS, Rank.QUEEN),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.CLUBS, Rank.TEN),
        new Card(Suit.DIAMONDS, Rank.NINE),
        new Card(Suit.HEARTS, Rank.EIGHT),
        new Card(Suit.SPADES, Rank.SEVEN),
      ];

      // Set up dealer stuck scenario
      baseGameState.currentHand.currentPlayerIndex = 3; // player4 is dealer
      baseGameState.currentHand.bids = [
        { playerId: "player1", amount: 0, passed: true },
        { playerId: "player2", amount: 0, passed: true },
        { playerId: "player3", amount: 0, passed: true },
      ];
      baseGameState.currentHand.currentBid = null;

      let dealerBids = 0;
      for (let i = 0; i < 20; i++) {
        const bid = biddingAI.calculateBid(dealerHand, baseGameState);
        if (bid !== null) {
          dealerBids++;
          expect(bid).toBeGreaterThanOrEqual(2); // Must bid at least 2
        }
      }

      // Dealer should be forced to bid most of the time when stuck
      expect(dealerBids).toBeGreaterThan(15);
    });
  });

  describe("Partnership coordination", () => {
    it("should be more conservative when partner has already bid", () => {
      const mediumHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.NINE),
      ];

      // Scenario 1: Partner hasn't bid yet
      baseGameState.currentHand.bids = [];
      const bidsWithoutPartner: number[] = [];

      // Scenario 2: Partner has already bid 3
      const gameStateWithPartnerBid = { ...baseGameState };
      gameStateWithPartnerBid.currentHand.bids = [
        { playerId: "player3", amount: 3, passed: false }, // player3 is player1's partner
      ];
      const bidsWithPartner: number[] = [];

      for (let i = 0; i < 30; i++) {
        const bidWithoutPartner = biddingAI.calculateBid(mediumHand, baseGameState);
        const bidWithPartner = biddingAI.calculateBid(mediumHand, gameStateWithPartnerBid);

        if (bidWithoutPartner !== null) bidsWithoutPartner.push(bidWithoutPartner);
        if (bidWithPartner !== null) bidsWithPartner.push(bidWithPartner);
      }

      // Should be less aggressive when partner has already bid
      expect(bidsWithPartner.length).toBeLessThanOrEqual(bidsWithoutPartner.length);
    });

    it("should help when partner is dealer and might be stuck", () => {
      const helpingHand = [
        new Card(Suit.HEARTS, Rank.QUEEN),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.CLUBS, Rank.TEN),
        new Card(Suit.DIAMONDS, Rank.NINE),
        new Card(Suit.HEARTS, Rank.EIGHT),
        new Card(Suit.SPADES, Rank.SEVEN),
      ];

      // Partner (player3) is dealer, others have passed
      baseGameState.players[2].isDealer = true; // player3 is dealer
      baseGameState.players[3].isDealer = false; // player4 is not dealer
      baseGameState.currentHand.currentPlayerIndex = 0; // player1's turn
      baseGameState.currentHand.bids = [
        { playerId: "player2", amount: 0, passed: true },
        { playerId: "player4", amount: 0, passed: true },
      ];

      let helpingBids = 0;
      for (let i = 0; i < 20; i++) {
        const bid = biddingAI.calculateBid(helpingHand, baseGameState);
        if (bid !== null) helpingBids++;
      }

      // Should be more likely to bid to help partner avoid being stuck
      expect(helpingBids).toBeGreaterThan(8);
    });
  });

  describe("Score-based adjustments", () => {
    it("should bid more aggressively when significantly behind", () => {
      const catchupHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.TEN),
        new Card(Suit.HEARTS, Rank.NINE),
        new Card(Suit.SPADES, Rank.EIGHT),
      ];

      // Scenario 1: Even score
      baseGameState.partnerships[0].score = 10;
      baseGameState.partnerships[1].score = 10;
      const evenScoreBids: number[] = [];

      // Scenario 2: Behind by 8 points
      const behindGameState = { ...baseGameState };
      behindGameState.partnerships = [
        { id: "partnership1", player1Id: "player1", player2Id: "player3", score: 5 },
        { id: "partnership2", player1Id: "player2", player2Id: "player4", score: 13 },
      ];
      const behindBids: number[] = [];

      for (let i = 0; i < 30; i++) {
        const evenBid = biddingAI.calculateBid(catchupHand, baseGameState);
        const behindBid = biddingAI.calculateBid(catchupHand, behindGameState);

        if (evenBid !== null) evenScoreBids.push(evenBid);
        if (behindBid !== null) behindBids.push(behindBid);
      }

      // Should bid more often when behind
      expect(behindBids.length).toBeGreaterThanOrEqual(evenScoreBids.length);
    });

    it("should bid more conservatively when close to winning", () => {
      const conserveHand = [
        new Card(Suit.HEARTS, Rank.QUEEN),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.CLUBS, Rank.TEN),
        new Card(Suit.DIAMONDS, Rank.NINE),
        new Card(Suit.HEARTS, Rank.EIGHT),
        new Card(Suit.SPADES, Rank.SEVEN),
      ];

      // Scenario 1: Normal score
      baseGameState.partnerships[0].score = 12;
      baseGameState.partnerships[1].score = 10;
      const normalBids: number[] = [];

      // Scenario 2: Close to winning (19 points)
      const closeToWinState = { ...baseGameState };
      closeToWinState.partnerships = [
        { id: "partnership1", player1Id: "player1", player2Id: "player3", score: 19 },
        { id: "partnership2", player1Id: "player2", player2Id: "player4", score: 12 },
      ];
      const conservativeBids: number[] = [];

      for (let i = 0; i < 30; i++) {
        const normalBid = biddingAI.calculateBid(conserveHand, baseGameState);
        const conservativeBid = biddingAI.calculateBid(conserveHand, closeToWinState);

        if (normalBid !== null) normalBids.push(normalBid);
        if (conservativeBid !== null) conservativeBids.push(conservativeBid);
      }

      // Should bid less often when close to winning
      expect(conservativeBids.length).toBeLessThan(normalBids.length);
    });
  });

  describe("Personality consistency", () => {
    it("should maintain personality traits across multiple decisions", () => {
      const testHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.NINE),
      ];

      const personalities = [AIPersonality.CONSERVATIVE, AIPersonality.AGGRESSIVE];
      const results: { [key: string]: number[] } = {
        [AIPersonality.CONSERVATIVE]: [],
        [AIPersonality.AGGRESSIVE]: [],
      };

      // Collect bidding data for each personality
      for (let i = 0; i < 50; i++) {
        for (const personality of personalities) {
          const bid = biddingAI.calculateBid(testHand, baseGameState, personality);
          if (bid !== null) {
            results[personality].push(bid);
          }
        }
      }

      // Aggressive should bid more often
      expect(results[AIPersonality.AGGRESSIVE].length).toBeGreaterThanOrEqual(
        results[AIPersonality.CONSERVATIVE].length
      );

      // When they do bid, aggressive should tend toward higher amounts
      if (results[AIPersonality.CONSERVATIVE].length > 0 && results[AIPersonality.AGGRESSIVE].length > 0) {
        const avgConservative =
          results[AIPersonality.CONSERVATIVE].reduce((a, b) => a + b, 0) / results[AIPersonality.CONSERVATIVE].length;
        const avgAggressive =
          results[AIPersonality.AGGRESSIVE].reduce((a, b) => a + b, 0) / results[AIPersonality.AGGRESSIVE].length;

        expect(avgAggressive).toBeGreaterThanOrEqual(avgConservative);
      }
    });
  });

  describe("Edge case robustness", () => {
    it("should handle extreme score scenarios", () => {
      const testHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.NINE),
      ];

      // Opponent very close to winning
      baseGameState.partnerships[1].score = 20; // One point from winning

      let desperateBids = 0;
      for (let i = 0; i < 20; i++) {
        const bid = biddingAI.calculateBid(testHand, baseGameState);
        if (bid !== null) desperateBids++;
      }

      // Should be very aggressive when opponent is about to win
      expect(desperateBids).toBeGreaterThan(12);
    });

    it("should respect maximum bid limit", () => {
      const strongHand = [
        new Card(null, Rank.JOKER),
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.DIAMONDS, Rank.JACK),
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.KING),
        new Card(Suit.HEARTS, Rank.QUEEN),
      ];

      // Test all possible bid scenarios
      for (let currentBid = 2; currentBid <= 6; currentBid++) {
        baseGameState.currentHand.currentBid = { playerId: "player2", amount: currentBid, passed: false };

        for (let i = 0; i < 10; i++) {
          const bid = biddingAI.calculateBid(strongHand, baseGameState);
          if (bid !== null) {
            expect(bid).toBeLessThanOrEqual(6);
            expect(bid).toBeGreaterThan(currentBid);
          }
        }
      }
    });
  });

  describe("Statistical consistency", () => {
    it("should show predictable patterns over many decisions", () => {
      const hands = {
        weak: [
          new Card(Suit.SPADES, Rank.TWO),
          new Card(Suit.CLUBS, Rank.THREE),
          new Card(Suit.DIAMONDS, Rank.FOUR),
          new Card(Suit.HEARTS, Rank.FIVE),
          new Card(Suit.SPADES, Rank.SIX),
          new Card(Suit.CLUBS, Rank.SEVEN),
        ],
        strong: [
          new Card(null, Rank.JOKER),
          new Card(Suit.HEARTS, Rank.JACK),
          new Card(Suit.DIAMONDS, Rank.JACK),
          new Card(Suit.HEARTS, Rank.ACE),
          new Card(Suit.HEARTS, Rank.KING),
          new Card(Suit.HEARTS, Rank.TEN),
        ],
      };

      const stats = { weak: { bids: 0, passes: 0 }, strong: { bids: 0, passes: 0 } };

      // Collect statistics over many trials
      for (let i = 0; i < 100; i++) {
        for (const [handType, hand] of Object.entries(hands)) {
          const bid = biddingAI.calculateBid(hand, baseGameState);
          if (bid !== null) {
            stats[handType as keyof typeof stats].bids++;
          } else {
            stats[handType as keyof typeof stats].passes++;
          }
        }
      }

      // Strong hands should bid much more often than weak hands
      const weakBidRate = stats.weak.bids / (stats.weak.bids + stats.weak.passes);
      const strongBidRate = stats.strong.bids / (stats.strong.bids + stats.strong.passes);

      expect(strongBidRate).toBeGreaterThan(weakBidRate + 0.3); // At least 30% higher rate
      expect(strongBidRate).toBeGreaterThan(0.7); // Strong hands should bid most of the time
      expect(weakBidRate).toBeLessThan(0.3); // Weak hands should rarely bid
    });
  });
});
