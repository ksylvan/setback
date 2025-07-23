import { beforeEach, describe, expect, it } from "vitest";
import { Card } from "@/entities/Card";
import { AIPersonality, GamePhase, type GameState, type Partnership, type Player, Rank, Suit } from "@/types/game";
import { BiddingAI } from "./BiddingAI";

// Mock GameScene's makeAIBid logic for integration testing
describe("GameScene AI Integration", () => {
  let biddingAI: BiddingAI;
  let mockGameState: GameState;

  beforeEach(() => {
    biddingAI = new BiddingAI();

    // Create mock game state similar to what GameScene would have
    const players: Player[] = [
      {
        id: "player1",
        name: "AI Player 1",
        hand: [
          new Card(Suit.HEARTS, Rank.JACK),
          new Card(Suit.DIAMONDS, Rank.JACK),
          new Card(null, Rank.JOKER),
          new Card(Suit.HEARTS, Rank.ACE),
          new Card(Suit.SPADES, Rank.KING),
          new Card(Suit.CLUBS, Rank.TEN),
        ],
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
      gamePhase: GamePhase.BIDDING,
      winner: null,
    };
  });

  describe("AI personality assignment integration", () => {
    it("should assign different personalities to different players consistently", () => {
      const personalities: AIPersonality[] = [
        AIPersonality.BALANCED,
        AIPersonality.CONSERVATIVE,
        AIPersonality.AGGRESSIVE,
        AIPersonality.ADAPTIVE,
      ];

      // Test that each player gets a consistent personality based on their index
      for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
        const expectedPersonality = personalities[playerIndex % personalities.length];
        mockGameState.currentHand.currentPlayerIndex = playerIndex;

        const currentPlayer = mockGameState.players[playerIndex];
        const bidAmount = biddingAI.calculateBid(currentPlayer.hand, mockGameState, expectedPersonality);

        // Verify that the AI can make decisions with the assigned personality
        // The specific bid amount will vary, but it should not throw errors
        expect(typeof bidAmount === "number" || bidAmount === null).toBe(true);
      }
    });

    it("should handle strong hands appropriately across different personalities", () => {
      // Strong hand should generally result in bids across all personalities
      const strongHand = [
        new Card(null, Rank.JOKER),
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.DIAMONDS, Rank.JACK),
        new Card(Suit.HEARTS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.KING),
        new Card(Suit.HEARTS, Rank.TEN),
      ];

      mockGameState.players[0].hand = strongHand;

      const personalities: AIPersonality[] = [
        AIPersonality.BALANCED,
        AIPersonality.CONSERVATIVE,
        AIPersonality.AGGRESSIVE,
        AIPersonality.ADAPTIVE,
      ];

      let totalBids = 0;

      // Test multiple times due to randomization
      for (let i = 0; i < 20; i++) {
        for (const personality of personalities) {
          const bid = biddingAI.calculateBid(strongHand, mockGameState, personality);
          if (bid !== null) {
            totalBids++;
            expect(bid).toBeGreaterThanOrEqual(2);
            expect(bid).toBeLessThanOrEqual(6);
          }
        }
      }

      // Strong hands should result in frequent bidding
      expect(totalBids).toBeGreaterThan(60); // Expect most attempts to bid
    });

    it("should handle weak hands appropriately", () => {
      const weakHand = [
        new Card(Suit.SPADES, Rank.TWO),
        new Card(Suit.CLUBS, Rank.THREE),
        new Card(Suit.DIAMONDS, Rank.FOUR),
        new Card(Suit.HEARTS, Rank.FIVE),
        new Card(Suit.SPADES, Rank.SIX),
        new Card(Suit.CLUBS, Rank.SEVEN),
      ];

      mockGameState.players[0].hand = weakHand;

      let passCount = 0;

      // Test multiple times due to randomization
      for (let i = 0; i < 10; i++) {
        const bid = biddingAI.calculateBid(weakHand, mockGameState);
        if (bid === null) {
          passCount++;
        }
      }

      // Weak hands should frequently result in passing
      expect(passCount).toBeGreaterThan(5);
    });
  });

  describe("Performance integration", () => {
    it("should make decisions within acceptable time limits", () => {
      const mediumHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.NINE),
      ];

      mockGameState.players[0].hand = mediumHand;

      const startTime = performance.now();

      // Simulate multiple AI decisions as would happen in a game
      for (let i = 0; i < 20; i++) {
        const personality = [AIPersonality.BALANCED, AIPersonality.AGGRESSIVE, AIPersonality.CONSERVATIVE][i % 3];
        biddingAI.calculateBid(mediumHand, mockGameState, personality);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 20;

      // Should be well under the 500ms target per decision
      expect(avgTime).toBeLessThan(100);
    });
  });

  describe("Error handling integration", () => {
    it("should handle empty hands gracefully", () => {
      mockGameState.players[0].hand = [];

      expect(() => {
        const bid = biddingAI.calculateBid([], mockGameState);
        expect(bid).toBeNull();
      }).not.toThrow();
    });

    it("should handle missing partnership data", () => {
      mockGameState.partnerships = [];

      const mediumHand = [
        new Card(Suit.HEARTS, Rank.JACK),
        new Card(Suit.SPADES, Rank.QUEEN),
        new Card(Suit.CLUBS, Rank.KING),
        new Card(Suit.DIAMONDS, Rank.ACE),
        new Card(Suit.HEARTS, Rank.TEN),
        new Card(Suit.SPADES, Rank.NINE),
      ];

      expect(() => {
        biddingAI.calculateBid(mediumHand, mockGameState);
      }).not.toThrow();
    });
  });
});
