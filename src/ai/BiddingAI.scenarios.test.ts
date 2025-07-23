import { beforeEach, describe, expect, it } from "vitest";
import { Card } from "@/entities/Card";
import { AIPersonality, type GameState, type Partnership, type Player, Rank, Suit } from "@/types/game";
import { BiddingAI } from "./BiddingAI";

describe("BiddingAI Real Game Scenarios", () => {
  let biddingAI: BiddingAI;
  let baseGameState: GameState;

  beforeEach(() => {
    biddingAI = new BiddingAI();

    const players: Player[] = [
      {
        id: "north",
        name: "North AI",
        hand: [],
        position: "north" as any,
        partnerId: "south",
        isHuman: false,
        isDealer: false,
      },
      {
        id: "east",
        name: "East AI",
        hand: [],
        position: "east" as any,
        partnerId: "west",
        isHuman: false,
        isDealer: false,
      },
      {
        id: "south",
        name: "South AI",
        hand: [],
        position: "south" as any,
        partnerId: "north",
        isHuman: false,
        isDealer: false,
      },
      {
        id: "west",
        name: "West AI",
        hand: [],
        position: "west" as any,
        partnerId: "east",
        isHuman: false,
        isDealer: true,
      },
    ];

    const partnerships: Partnership[] = [
      { id: "ns", player1Id: "north", player2Id: "south", score: 0 },
      { id: "ew", player1Id: "east", player2Id: "west", score: 0 },
    ];

    baseGameState = {
      players,
      partnerships,
      currentHand: {
        trumpSuit: null,
        currentBid: null,
        biddingPhase: true,
        currentPlayerIndex: 1, // East starts (left of dealer)
        tricks: [],
        currentTrick: null,
        bids: [],
      },
      deck: [],
      gamePhase: "bidding" as any,
      winner: null,
    };
  });

  describe("Complete bidding round simulations", () => {
    it("should handle a typical bidding round from start to finish", () => {
      // Assign realistic hands to all players
      const hands = {
        north: [
          new Card(Suit.HEARTS, Rank.JACK),
          new Card(Suit.DIAMONDS, Rank.JACK),
          new Card(Suit.HEARTS, Rank.ACE),
          new Card(Suit.SPADES, Rank.KING),
          new Card(Suit.CLUBS, Rank.QUEEN),
          new Card(Suit.HEARTS, Rank.TEN),
        ],
        east: [
          new Card(Suit.SPADES, Rank.TWO),
          new Card(Suit.CLUBS, Rank.THREE),
          new Card(Suit.DIAMONDS, Rank.FOUR),
          new Card(Suit.HEARTS, Rank.FIVE),
          new Card(Suit.SPADES, Rank.SIX),
          new Card(Suit.CLUBS, Rank.SEVEN),
        ],
        south: [
          new Card(Suit.SPADES, Rank.JACK),
          new Card(Suit.CLUBS, Rank.JACK),
          new Card(Suit.SPADES, Rank.ACE),
          new Card(Suit.DIAMONDS, Rank.KING),
          new Card(Suit.HEARTS, Rank.QUEEN),
          new Card(Suit.SPADES, Rank.TEN),
        ],
        west: [
          new Card(null, Rank.JOKER),
          new Card(Suit.DIAMONDS, Rank.ACE),
          new Card(Suit.CLUBS, Rank.KING),
          new Card(Suit.DIAMONDS, Rank.QUEEN),
          new Card(Suit.CLUBS, Rank.TEN),
          new Card(Suit.DIAMONDS, Rank.NINE),
        ],
      };

      baseGameState.players[0].hand = hands.north;
      baseGameState.players[1].hand = hands.east;
      baseGameState.players[2].hand = hands.south;
      baseGameState.players[3].hand = hands.west;

      const biddingResults: Array<{ player: string; bid: number | null }> = [];
      let currentPlayerIndex = 1; // Start with East

      // Simulate complete bidding round
      for (let round = 0; round < 4; round++) {
        baseGameState.currentHand.currentPlayerIndex = currentPlayerIndex;
        const currentPlayer = baseGameState.players[currentPlayerIndex];

        const bid = biddingAI.calculateBid(currentPlayer.hand, baseGameState, AIPersonality.BALANCED);

        biddingResults.push({ player: currentPlayer.id, bid });

        if (bid !== null) {
          baseGameState.currentHand.currentBid = { playerId: currentPlayer.id, amount: bid, passed: false };
          baseGameState.currentHand.bids.push({ playerId: currentPlayer.id, amount: bid, passed: false });
        } else {
          baseGameState.currentHand.bids.push({ playerId: currentPlayer.id, amount: 0, passed: true });
        }

        currentPlayerIndex = (currentPlayerIndex + 1) % 4;
      }

      // Verify realistic bidding behavior
      expect(biddingResults).toHaveLength(4);

      // Strong hands (north, south, west) should be more likely to bid
      const strongPlayerBids = biddingResults.filter(
        (r) => ["north", "south", "west"].includes(r.player) && r.bid !== null
      );
      const weakPlayerBids = biddingResults.filter((r) => r.player === "east" && r.bid !== null);

      expect(strongPlayerBids.length).toBeGreaterThan(weakPlayerBids.length);

      // At least one player should bid (game must continue)
      const totalBids = biddingResults.filter((r) => r.bid !== null).length;
      expect(totalBids).toBeGreaterThan(0);
    });

    it("should handle escalating bid wars correctly", () => {
      // Two players with strong hands
      const strongHand1 = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.DIAMONDS, Rank.JACK),
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.KING),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.QUEEN),
      ];

      const strongHand2 = [
        new Card(null, Rank.JOKER),
        new Card(Suit.SPADES, Rank.JACK),
        new Card(Suit.CLUBS, Rank.JACK),
        new Card(Suit.SPADES, Rank.ACE),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.SPADES, Rank.TEN),
      ];

      baseGameState.players[0].hand = strongHand1; // North
      baseGameState.players[2].hand = strongHand2; // South (North's partner)

      // Simulate bid war scenario
      const bidSequence = [2, 3, 4, 5]; // Escalating bids

      for (const bidAmount of bidSequence) {
        // Test if AI will bid higher than current amount
        baseGameState.currentHand.currentBid = { playerId: "opponent", amount: bidAmount, passed: false };

        const northBid = biddingAI.calculateBid(strongHand1, baseGameState, AIPersonality.AGGRESSIVE);
        const southBid = biddingAI.calculateBid(strongHand2, baseGameState, AIPersonality.AGGRESSIVE);

        // At least one should be willing to bid higher (until it gets too expensive)
        if (bidAmount < 5) {
          expect(northBid !== null || southBid !== null).toBe(true);
          if (northBid !== null) expect(northBid).toBeGreaterThan(bidAmount);
          if (southBid !== null) expect(southBid).toBeGreaterThan(bidAmount);
        }
      }
    });
  });

  describe("Critical game moments", () => {
    it("should handle must-win situations appropriately", () => {
      const desperateHand = [
        new Card(Suit.HEARTS, Rank.QUEEN),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.CLUBS, Rank.TEN),
        new Card(Suit.DIAMONDS, Rank.NINE),
        new Card(Suit.HEARTS, Rank.EIGHT),
        new Card(Suit.SPADES, Rank.SEVEN),
      ];

      // Opponent partnership is at 20 points (one away from winning)
      baseGameState.partnerships[1].score = 20;
      baseGameState.partnerships[0].score = 10;

      let desperateBids = 0;
      let totalBids = 0;

      for (let i = 0; i < 30; i++) {
        const bid = biddingAI.calculateBid(desperateHand, baseGameState, AIPersonality.BALANCED);
        if (bid !== null) {
          desperateBids++;
          totalBids += bid;
        }
      }

      // Should bid aggressively when opponent is about to win
      expect(desperateBids).toBeGreaterThan(10);
      if (desperateBids > 0) {
        const avgBid = totalBids / desperateBids;
        expect(avgBid).toBeGreaterThan(2.5); // Should bid higher on average
      }
    });

    it("should play conservatively when ahead and close to winning", () => {
      const cautiousHand = [
        new Card(Suit.HEARTS, Rank.QUEEN),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.CLUBS, Rank.TEN),
        new Card(Suit.DIAMONDS, Rank.NINE),
        new Card(Suit.HEARTS, Rank.EIGHT),
        new Card(Suit.SPADES, Rank.SEVEN),
      ];

      // AI partnership is at 19 points (two away from winning)
      baseGameState.partnerships[0].score = 19;
      baseGameState.partnerships[1].score = 12;

      let conservativeBids = 0;
      for (let i = 0; i < 30; i++) {
        const bid = biddingAI.calculateBid(cautiousHand, baseGameState, AIPersonality.BALANCED);
        if (bid !== null) {
          conservativeBids++;
        }
      }

      // Should be more conservative when close to winning
      expect(conservativeBids).toBeLessThan(25);
    });
  });

  describe("Partnership dynamics", () => {
    it("should coordinate with partner's bidding strategy", () => {
      const supportHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.NINE),
      ];

      // Scenario 1: Partner hasn't bid
      baseGameState.currentHand.currentPlayerIndex = 0; // North
      baseGameState.currentHand.bids = [{ playerId: "east", amount: 0, passed: true }];

      const bidsWithoutPartner: number[] = [];
      for (let i = 0; i < 20; i++) {
        const bid = biddingAI.calculateBid(supportHand, baseGameState);
        if (bid !== null) bidsWithoutPartner.push(bid);
      }

      // Scenario 2: Partner has bid 4
      baseGameState.currentHand.bids = [
        { playerId: "east", amount: 0, passed: true },
        { playerId: "south", amount: 4, passed: false }, // Partner bid
      ];

      const bidsWithPartner: number[] = [];
      for (let i = 0; i < 20; i++) {
        const bid = biddingAI.calculateBid(supportHand, baseGameState);
        if (bid !== null) bidsWithPartner.push(bid);
      }

      // Should be less likely to bid when partner has already committed
      expect(bidsWithPartner.length).toBeLessThanOrEqual(bidsWithoutPartner.length);
    });

    it("should avoid overbidding against partner", () => {
      const competitiveHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.DIAMONDS, Rank.JACK),
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.KING),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.QUEEN),
      ];

      // Partner has current high bid of 3
      baseGameState.currentHand.currentPlayerIndex = 0; // North
      baseGameState.currentHand.currentBid = { playerId: "south", amount: 3, passed: false }; // Partner's bid
      baseGameState.currentHand.bids = [
        { playerId: "east", amount: 0, passed: true },
        { playerId: "south", amount: 3, passed: false },
        { playerId: "west", amount: 0, passed: true },
      ];

      let overbids = 0;
      for (let i = 0; i < 20; i++) {
        const bid = biddingAI.calculateBid(competitiveHand, baseGameState);
        if (bid !== null && bid > 3) {
          overbids++;
        }
      }

      // Should rarely overbid partner (only with extremely strong hands)
      expect(overbids).toBeLessThan(15);
    });
  });

  describe("Hand evaluation accuracy", () => {
    it("should correctly evaluate joker-heavy hands", () => {
      const jokerHand = [
        new Card(null, Rank.JOKER),
        new Card(Suit.HEARTS, Rank.TWO),
        new Card(Suit.SPADES, Rank.THREE),
        new Card(Suit.CLUBS, Rank.FOUR),
        new Card(Suit.DIAMONDS, Rank.FIVE),
        new Card(Suit.HEARTS, Rank.SIX),
      ];

      const noJokerHand = [
        new Card(Suit.HEARTS, Rank.KING), // High card instead of joker
        new Card(Suit.HEARTS, Rank.TWO),
        new Card(Suit.SPADES, Rank.THREE),
        new Card(Suit.CLUBS, Rank.FOUR),
        new Card(Suit.DIAMONDS, Rank.FIVE),
        new Card(Suit.HEARTS, Rank.SIX),
      ];

      let jokerBids = 0;
      let noJokerBids = 0;

      for (let i = 0; i < 30; i++) {
        if (biddingAI.calculateBid(jokerHand, baseGameState) !== null) jokerBids++;
        if (biddingAI.calculateBid(noJokerHand, baseGameState) !== null) noJokerBids++;
      }

      // Joker should make the hand significantly more valuable
      expect(jokerBids).toBeGreaterThanOrEqual(noJokerBids);
    });

    it("should value off-jack correctly", () => {
      const withOffJack = [
        new Card(Suit.HEARTS, Rank.JACK), // Jack of hearts
        new Card(Suit.DIAMONDS, Rank.JACK), // Off-jack for hearts (red suit)
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.CLUBS, Rank.QUEEN),
        new Card(Suit.HEARTS, Rank.TEN),
      ];

      const withoutOffJack = [
        new Card(Suit.HEARTS, Rank.JACK), // Jack of hearts
        new Card(Suit.CLUBS, Rank.JACK), // Wrong color jack (black vs red)
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.SPADES, Rank.KING),
        new Card(Suit.CLUBS, Rank.QUEEN),
        new Card(Suit.HEARTS, Rank.TEN),
      ];

      let offJackBids = 0;
      let noOffJackBids = 0;
      let offJackBidTotal = 0;
      let noOffJackBidTotal = 0;

      for (let i = 0; i < 30; i++) {
        const offJackBid = biddingAI.calculateBid(withOffJack, baseGameState);
        const noOffJackBid = biddingAI.calculateBid(withoutOffJack, baseGameState);

        if (offJackBid !== null) {
          offJackBids++;
          offJackBidTotal += offJackBid;
        }
        if (noOffJackBid !== null) {
          noOffJackBids++;
          noOffJackBidTotal += noOffJackBid;
        }
      }

      // Off-jack should increase bidding frequency and/or amount
      expect(offJackBids).toBeGreaterThanOrEqual(noOffJackBids);

      if (offJackBids > 0 && noOffJackBids > 0) {
        const avgOffJack = offJackBidTotal / offJackBids;
        const avgNoOffJack = noOffJackBidTotal / noOffJackBids;
        expect(avgOffJack).toBeGreaterThanOrEqual(avgNoOffJack);
      }
    });
  });

  describe("Performance under pressure", () => {
    it("should make consistent decisions under time pressure", () => {
      const testHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.NINE),
      ];

      const decisions: Array<number | null> = [];
      const startTime = performance.now();

      // Make 100 rapid decisions
      for (let i = 0; i < 100; i++) {
        const decision = biddingAI.calculateBid(testHand, baseGameState);
        decisions.push(decision);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 100;

      // Should be fast enough for real-time gameplay
      expect(avgTime).toBeLessThan(50); // Under 50ms per decision

      // Decisions should be reasonably consistent
      const bids = decisions.filter((d) => d !== null) as number[];
      const passes = decisions.filter((d) => d === null).length;

      // Should show consistent behavior (not completely random)
      if (bids.length > 0) {
        const avgBid = bids.reduce((a, b) => a + b, 0) / bids.length;
        const bidVariance = bids.reduce((sum, bid) => sum + (bid - avgBid) ** 2, 0) / bids.length;

        // Variance should be reasonable (not too chaotic)
        expect(bidVariance).toBeLessThan(2.0);
      }

      // Should not be all passes or all bids (some variation expected)
      expect(bids.length).toBeGreaterThan(5);
      expect(passes).toBeGreaterThan(5);
    });
  });

  describe("Adaptive learning patterns", () => {
    it("should show different behavior with adaptive personality", () => {
      const adaptiveResults: { [handType: string]: { bids: number; passes: number } } = {
        weak: { bids: 0, passes: 0 },
        medium: { bids: 0, passes: 0 },
        strong: { bids: 0, passes: 0 },
      };

      const balancedResults: { [handType: string]: { bids: number; passes: number } } = {
        weak: { bids: 0, passes: 0 },
        medium: { bids: 0, passes: 0 },
        strong: { bids: 0, passes: 0 },
      };

      const hands = {
        weak: [
          new Card(Suit.SPADES, Rank.TWO),
          new Card(Suit.CLUBS, Rank.THREE),
          new Card(Suit.DIAMONDS, Rank.FOUR),
          new Card(Suit.HEARTS, Rank.FIVE),
          new Card(Suit.SPADES, Rank.SIX),
          new Card(Suit.CLUBS, Rank.SEVEN),
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
          new Card(null, Rank.JOKER),
          new Card(Suit.HEARTS, Rank.JACK),
          new Card(Suit.DIAMONDS, Rank.JACK),
          new Card(Suit.HEARTS, Rank.ACE),
          new Card(Suit.HEARTS, Rank.KING),
          new Card(Suit.HEARTS, Rank.TEN),
        ],
      };

      // Test both personalities across different hand strengths
      for (let i = 0; i < 30; i++) {
        for (const [handType, hand] of Object.entries(hands)) {
          const adaptiveBid = biddingAI.calculateBid(hand, baseGameState, AIPersonality.ADAPTIVE);
          const balancedBid = biddingAI.calculateBid(hand, baseGameState, AIPersonality.BALANCED);

          if (adaptiveBid !== null) {
            adaptiveResults[handType].bids++;
          } else {
            adaptiveResults[handType].passes++;
          }

          if (balancedBid !== null) {
            balancedResults[handType].bids++;
          } else {
            balancedResults[handType].passes++;
          }
        }
      }

      // Adaptive should show more extreme behavior (more aggressive with strong hands, more conservative with weak)
      const adaptiveStrongRate =
        adaptiveResults.strong.bids / (adaptiveResults.strong.bids + adaptiveResults.strong.passes);
      const balancedStrongRate =
        balancedResults.strong.bids / (balancedResults.strong.bids + balancedResults.strong.passes);

      const adaptiveWeakRate = adaptiveResults.weak.bids / (adaptiveResults.weak.bids + adaptiveResults.weak.passes);
      const balancedWeakRate = balancedResults.weak.bids / (balancedResults.weak.bids + balancedResults.weak.passes);

      // Adaptive should be more extreme in both directions
      expect(adaptiveStrongRate - adaptiveWeakRate).toBeGreaterThan(balancedStrongRate - balancedWeakRate);
    });
  });
});
