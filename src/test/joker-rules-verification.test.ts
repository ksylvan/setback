import { beforeEach, describe, expect, it, vi } from "vitest";
import { Card } from "@/entities/Card";
import { GameManager } from "@/managers/GameManager";
import { Rank, Suit } from "@/types/game";

/**
 * Comprehensive test suite to verify the joker rule fixes:
 * 1. Joker trump hierarchy (10.5 ranking)
 * 2. Joker leading restrictions
 */
describe("Joker Rules Verification Tests", () => {
  describe("Joker Trump Hierarchy (10.5 Ranking)", () => {
    it("should verify complete trump hierarchy with joker as 10.5", () => {
      const trumpSuit = Suit.HEARTS;

      // Create all trump cards
      const joker = new Card(null, Rank.JOKER);
      const jackOfTrump = new Card(Suit.HEARTS, Rank.JACK);
      const offJack = new Card(Suit.DIAMONDS, Rank.JACK); // Same color as hearts
      const aceOfTrump = new Card(Suit.HEARTS, Rank.ACE);
      const kingOfTrump = new Card(Suit.HEARTS, Rank.KING);
      const queenOfTrump = new Card(Suit.HEARTS, Rank.QUEEN);
      const tenOfTrump = new Card(Suit.HEARTS, Rank.TEN);
      const nineOfTrump = new Card(Suit.HEARTS, Rank.NINE);

      // Verify hierarchy: Jack > Off-Jack > Ace > King > Queen > Joker > Ten > Nine

      // 1. Jack of trump beats everyone
      expect(jackOfTrump.compareForTrump(offJack, trumpSuit)).toBe(1);
      expect(jackOfTrump.compareForTrump(aceOfTrump, trumpSuit)).toBe(1);
      expect(jackOfTrump.compareForTrump(kingOfTrump, trumpSuit)).toBe(1);
      expect(jackOfTrump.compareForTrump(queenOfTrump, trumpSuit)).toBe(1);
      expect(jackOfTrump.compareForTrump(joker, trumpSuit)).toBe(1);
      expect(jackOfTrump.compareForTrump(tenOfTrump, trumpSuit)).toBe(1);

      // 2. Off-jack beats ace, king, queen, joker, but loses to jack of trump
      expect(offJack.compareForTrump(jackOfTrump, trumpSuit)).toBe(-1);
      expect(offJack.compareForTrump(aceOfTrump, trumpSuit)).toBe(1);
      expect(offJack.compareForTrump(kingOfTrump, trumpSuit)).toBe(1);
      expect(offJack.compareForTrump(queenOfTrump, trumpSuit)).toBe(1);
      expect(offJack.compareForTrump(joker, trumpSuit)).toBe(1);
      expect(offJack.compareForTrump(tenOfTrump, trumpSuit)).toBe(1);

      // 3. Face cards (A, K, Q) beat joker
      expect(aceOfTrump.compareForTrump(joker, trumpSuit)).toBe(1);
      expect(kingOfTrump.compareForTrump(joker, trumpSuit)).toBe(1);
      expect(queenOfTrump.compareForTrump(joker, trumpSuit)).toBe(1);

      // 4. Joker beats ten and lower
      expect(joker.compareForTrump(tenOfTrump, trumpSuit)).toBe(1);
      expect(joker.compareForTrump(nineOfTrump, trumpSuit)).toBe(1);

      // 5. Verify face card hierarchy among themselves
      expect(aceOfTrump.compareForTrump(kingOfTrump, trumpSuit)).toBe(1);
      expect(kingOfTrump.compareForTrump(queenOfTrump, trumpSuit)).toBe(1);

      // 6. Verify ten beats lower cards
      expect(tenOfTrump.compareForTrump(nineOfTrump, trumpSuit)).toBe(1);
    });

    it("should verify joker loses to all face cards across different trump suits", () => {
      const joker = new Card(null, Rank.JOKER);

      // Test with all trump suits
      const trumpSuits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];

      trumpSuits.forEach((trumpSuit) => {
        const jackOfTrump = new Card(trumpSuit, Rank.JACK);
        const aceOfTrump = new Card(trumpSuit, Rank.ACE);
        const kingOfTrump = new Card(trumpSuit, Rank.KING);
        const queenOfTrump = new Card(trumpSuit, Rank.QUEEN);

        // All face cards should beat joker
        expect(jackOfTrump.compareForTrump(joker, trumpSuit)).toBe(1);
        expect(aceOfTrump.compareForTrump(joker, trumpSuit)).toBe(1);
        expect(kingOfTrump.compareForTrump(joker, trumpSuit)).toBe(1);
        expect(queenOfTrump.compareForTrump(joker, trumpSuit)).toBe(1);

        // Joker should lose to all face cards
        expect(joker.compareForTrump(jackOfTrump, trumpSuit)).toBe(-1);
        expect(joker.compareForTrump(aceOfTrump, trumpSuit)).toBe(-1);
        expect(joker.compareForTrump(kingOfTrump, trumpSuit)).toBe(-1);
        expect(joker.compareForTrump(queenOfTrump, trumpSuit)).toBe(-1);
      });
    });

    it("should verify trick winner evaluation with new joker hierarchy", () => {
      const gameManager = new GameManager({
        targetScore: 21,
        players: [
          { name: "Player 1", isHuman: true },
          { name: "Player 2", isHuman: false },
          { name: "Player 3", isHuman: false },
          { name: "Player 4", isHuman: false },
        ],
      });

      gameManager.startGame();

      // Complete bidding phase
      let state = gameManager.getGameState();
      let currentPlayer = state.players[state.currentHand.currentPlayerIndex];
      gameManager.placeBid(currentPlayer.id, 3);

      for (let i = 0; i < 3; i++) {
        state = gameManager.getGameState();
        currentPlayer = state.players[state.currentHand.currentPlayerIndex];
        gameManager.placeBid(currentPlayer.id, null);
      }

      // Establish trump
      state = gameManager.getGameState();
      const bidWinner = state.players[state.currentHand.currentPlayerIndex];
      const trumpCard = new Card(Suit.HEARTS, Rank.TWO);
      bidWinner.hand = [trumpCard, ...bidWinner.hand.slice(1)];
      gameManager.playCard(bidWinner.id, trumpCard.id);

      // Create a trick where face card should beat joker
      const players = gameManager.getGameState().players;

      // Player 2: Ace of trump (should win)
      const player2Index = gameManager.getGameState().currentHand.currentPlayerIndex;
      const player2 = players[player2Index];
      const aceOfTrump = new Card(Suit.HEARTS, Rank.ACE);
      player2.hand = [aceOfTrump, ...player2.hand.slice(1)];
      gameManager.playCard(player2.id, aceOfTrump.id);

      // Player 3: Joker (should lose to ace)
      const player3Index = gameManager.getGameState().currentHand.currentPlayerIndex;
      const player3 = players[player3Index];
      const joker = new Card(null, Rank.JOKER);
      player3.hand = [joker, ...player3.hand.slice(1)];
      gameManager.playCard(player3.id, joker.id);

      // Player 4: Ten of trump (should lose to both)
      const player4Index = gameManager.getGameState().currentHand.currentPlayerIndex;
      const player4 = players[player4Index];
      const tenOfTrump = new Card(Suit.HEARTS, Rank.TEN);
      player4.hand = [tenOfTrump, ...player4.hand.slice(1)];
      gameManager.playCard(player4.id, tenOfTrump.id);

      // Verify ace of trump won the trick
      const completedTricks = gameManager.getGameState().currentHand.tricks;
      expect(completedTricks[0].winner).toBe(player2.id);
    });
  });

  describe("Joker Leading Rule Restrictions", () => {
    let gameManager: GameManager;

    beforeEach(() => {
      gameManager = new GameManager({
        targetScore: 21,
        players: [
          { name: "Player 1", isHuman: true },
          { name: "Player 2", isHuman: false },
          { name: "Player 3", isHuman: false },
          { name: "Player 4", isHuman: false },
        ],
      });

      gameManager.startGame();

      // Complete bidding
      let state = gameManager.getGameState();
      let currentPlayer = state.players[state.currentHand.currentPlayerIndex];
      gameManager.placeBid(currentPlayer.id, 3);

      for (let i = 0; i < 3; i++) {
        state = gameManager.getGameState();
        currentPlayer = state.players[state.currentHand.currentPlayerIndex];
        gameManager.placeBid(currentPlayer.id, null);
      }

      // Establish trump with first card
      state = gameManager.getGameState();
      const bidWinner = state.players[state.currentHand.currentPlayerIndex];
      const trumpCard = bidWinner.hand.find((card) => !card.isJoker) || new Card(Suit.HEARTS, Rank.ACE);
      if (!bidWinner.hand.includes(trumpCard)) {
        bidWinner.hand[0] = trumpCard;
      }
      gameManager.playCard(bidWinner.id, trumpCard.id);

      // Complete first trick
      for (let i = 0; i < 3; i++) {
        const currentState = gameManager.getGameState();
        const currentPlayer = currentState.players[currentState.currentHand.currentPlayerIndex];
        const anyCard = currentPlayer.hand[0];
        gameManager.playCard(currentPlayer.id, anyCard.id);
      }
    });

    it("should prevent joker from leading when player has multiple cards", () => {
      const mockEmit = vi.spyOn(gameManager, "emit");
      const state = gameManager.getGameState();
      const trickLeader = state.players[state.currentHand.currentPlayerIndex];

      // Ensure player has multiple cards including a joker
      while (trickLeader.hand.length < 3) {
        trickLeader.hand.push(new Card(Suit.SPADES, Rank.FIVE));
      }
      const joker = new Card(null, Rank.JOKER);
      trickLeader.hand.push(joker);

      const result = gameManager.playCard(trickLeader.id, joker.id);

      expect(result).toBe(false);
      expect(mockEmit).toHaveBeenCalledWith("invalidPlay", {
        reason: "Joker can only be led if it's your last card",
        playerId: trickLeader.id,
        cardId: joker.id,
      });
    });

    it("should allow joker to be led when it's the player's last card", () => {
      const mockEmit = vi.spyOn(gameManager, "emit");
      const state = gameManager.getGameState();
      const trickLeader = state.players[state.currentHand.currentPlayerIndex];

      // Clear hand and leave only joker
      trickLeader.hand.length = 0;
      const joker = new Card(null, Rank.JOKER);
      trickLeader.hand.push(joker);

      const result = gameManager.playCard(trickLeader.id, joker.id);

      expect(result).toBe(true);
      expect(mockEmit).toHaveBeenCalledWith("cardPlayed", expect.any(Object));
    });

    it("should allow joker when following (not leading) regardless of hand size", () => {
      const mockEmit = vi.spyOn(gameManager, "emit");
      const state = gameManager.getGameState();
      const trickLeader = state.players[state.currentHand.currentPlayerIndex];

      // Leader plays a non-joker card first
      const leadCard = trickLeader.hand.find((card) => !card.isJoker) || new Card(Suit.CLUBS, Rank.KING);
      if (!trickLeader.hand.includes(leadCard)) {
        trickLeader.hand[0] = leadCard;
      }
      gameManager.playCard(trickLeader.id, leadCard.id);

      // Next player follows with joker (should be allowed)
      const nextState = gameManager.getGameState();
      const follower = nextState.players[nextState.currentHand.currentPlayerIndex];

      // Ensure follower has multiple cards including joker
      while (follower.hand.length < 3) {
        follower.hand.push(new Card(Suit.SPADES, Rank.SEVEN));
      }
      const joker = new Card(null, Rank.JOKER);
      follower.hand.push(joker);

      const result = gameManager.playCard(follower.id, joker.id);

      expect(result).toBe(true);
      expect(mockEmit).toHaveBeenCalledWith("cardPlayed", expect.any(Object));
    });

    it("should verify joker leading rule across multiple trick scenarios", () => {
      const scenarios = [
        { handSize: 2, shouldFail: true, description: "2 cards including joker" },
        { handSize: 3, shouldFail: true, description: "3 cards including joker" },
        { handSize: 6, shouldFail: true, description: "6 cards including joker" },
      ];

      scenarios.forEach((scenario) => {
        const state = gameManager.getGameState();
        const trickLeader = state.players[state.currentHand.currentPlayerIndex];

        // Set up hand with specified size
        trickLeader.hand.length = 0;
        const joker = new Card(null, Rank.JOKER);
        trickLeader.hand.push(joker);

        // Add additional cards if needed
        for (let i = 1; i < scenario.handSize; i++) {
          trickLeader.hand.push(new Card(Suit.SPADES, Rank.TWO + i));
        }

        const result = gameManager.playCard(trickLeader.id, joker.id);
        expect(result).toBe(false); // Should always fail when multiple cards
      });

      // Test the success case separately
      const state = gameManager.getGameState();
      const trickLeader = state.players[state.currentHand.currentPlayerIndex];

      // Clear hand and leave only joker
      trickLeader.hand.length = 0;
      const joker = new Card(null, Rank.JOKER);
      trickLeader.hand.push(joker);

      const result = gameManager.playCard(trickLeader.id, joker.id);
      expect(result).toBe(true); // Should succeed when it's the last card
    });
  });

  describe("Combined Joker Rules Integration", () => {
    it("should verify joker rules work together in complete game scenario", () => {
      const gameManager = new GameManager({
        targetScore: 21,
        players: [
          { name: "Player 1", isHuman: true },
          { name: "Player 2", isHuman: false },
          { name: "Player 3", isHuman: false },
          { name: "Player 4", isHuman: false },
        ],
      });

      gameManager.startGame();

      // Complete bidding
      let state = gameManager.getGameState();
      let currentPlayer = state.players[state.currentHand.currentPlayerIndex];
      gameManager.placeBid(currentPlayer.id, 3);

      for (let i = 0; i < 3; i++) {
        state = gameManager.getGameState();
        currentPlayer = state.players[state.currentHand.currentPlayerIndex];
        gameManager.placeBid(currentPlayer.id, null);
      }

      // Test scenario: Joker vs Face Card hierarchy in actual trick
      state = gameManager.getGameState();
      const players = state.players;

      // Player 1 (bid winner): Establish trump with 2 of hearts
      const player1 = players[state.currentHand.currentPlayerIndex];
      const trumpEstablisher = new Card(Suit.HEARTS, Rank.TWO);
      player1.hand = [trumpEstablisher, ...player1.hand.slice(1)];
      gameManager.playCard(player1.id, trumpEstablisher.id);

      // Player 2: Play joker (legal as follower)
      const player2 = players[gameManager.getGameState().currentHand.currentPlayerIndex];
      const joker = new Card(null, Rank.JOKER);
      player2.hand = [joker, ...player2.hand.slice(1)];
      const jokerPlayResult = gameManager.playCard(player2.id, joker.id);
      expect(jokerPlayResult).toBe(true); // Should be allowed when following

      // Player 3: Play King of trump (should beat joker)
      const player3 = players[gameManager.getGameState().currentHand.currentPlayerIndex];
      const kingOfTrump = new Card(Suit.HEARTS, Rank.KING);
      player3.hand = [kingOfTrump, ...player3.hand.slice(1)];
      gameManager.playCard(player3.id, kingOfTrump.id);

      // Player 4: Play 3 of trump (should lose to everyone)
      const player4 = players[gameManager.getGameState().currentHand.currentPlayerIndex];
      const lowTrump = new Card(Suit.HEARTS, Rank.THREE);
      player4.hand = [lowTrump, ...player4.hand.slice(1)];
      gameManager.playCard(player4.id, lowTrump.id);

      // King of trump should win (Player 3)
      const completedTricks = gameManager.getGameState().currentHand.tricks;
      expect(completedTricks[0].winner).toBe(player3.id);

      // Verify joker leading rule: Player 3 (trick winner) now leads
      // If they try to lead with joker when having multiple cards, it should fail
      const nextTrickLeader = players[gameManager.getGameState().currentHand.currentPlayerIndex];
      expect(nextTrickLeader.id).toBe(player3.id); // Verify King winner leads next trick

      // Add joker to winner's hand and try to lead with it
      const anotherJoker = new Card(null, Rank.JOKER);
      nextTrickLeader.hand.push(anotherJoker);

      // Should fail because leader has multiple cards
      const leadingJokerResult = gameManager.playCard(nextTrickLeader.id, anotherJoker.id);
      expect(leadingJokerResult).toBe(false);
    });
  });
});
