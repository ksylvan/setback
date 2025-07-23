import { beforeEach, describe, expect, it, vi } from "vitest";
import { Card } from "@/entities/Card";
import { Rank, Suit } from "@/types/game";
import { GameManager } from "./GameManager";

describe("GameManager - Card Playing Mechanics (SB-001)", () => {
  let gameManager: GameManager;
  let mockEventEmitter: any;

  beforeEach(() => {
    const playerConfig = [
      { name: "Player 1", isHuman: true },
      { name: "AI Player 2", isHuman: false },
      { name: "AI Player 3", isHuman: false },
      { name: "AI Player 4", isHuman: false },
    ];
    gameManager = new GameManager({ targetScore: 21, players: playerConfig });

    // Start game and complete bidding to get to playing phase
    gameManager.startGame();

    // Complete a full bidding round: first player bids 3, rest pass
    let state = gameManager.getGameState();
    let currentPlayer = state.players[state.currentHand.currentPlayerIndex];
    gameManager.placeBid(currentPlayer.id, 3); // First player bids 3

    // Next 3 players pass
    for (let i = 0; i < 3; i++) {
      state = gameManager.getGameState();
      currentPlayer = state.players[state.currentHand.currentPlayerIndex];
      gameManager.placeBid(currentPlayer.id, null); // Pass
    }

    // Mock event emissions to verify they're called (after bidding is complete)
    mockEventEmitter = vi.spyOn(gameManager, "emit");
  });

  describe("playCard() - Core Validation", () => {
    it("should successfully play a valid card", () => {
      const state = gameManager.getGameState();
      const currentPlayer = state.players[state.currentHand.currentPlayerIndex];
      // Ensure we use a non-joker card for the first play
      const cardToPlay = currentPlayer.hand.find((card) => !card.isJoker) || currentPlayer.hand[0];

      const result = gameManager.playCard(currentPlayer.id, cardToPlay.id);

      expect(result).toBe(true);
      expect(mockEventEmitter).toHaveBeenCalledWith("cardPlayed", expect.any(Object));
    });

    it("should reject card play from wrong player", () => {
      const state = gameManager.getGameState();
      const wrongPlayer = state.players[(state.currentHand.currentPlayerIndex + 1) % 4];
      const cardToPlay = wrongPlayer.hand[0];

      const result = gameManager.playCard(wrongPlayer.id, cardToPlay.id);

      expect(result).toBe(false);
      expect(mockEventEmitter).not.toHaveBeenCalledWith("cardPlayed", expect.any(Object));
    });

    it("should reject card play when not in PLAYING phase", () => {
      // Reset to bidding phase
      const freshGameManager = new GameManager({
        targetScore: 21,
        players: [
          { name: "Player 1", isHuman: true },
          { name: "AI Player 2", isHuman: false },
          { name: "AI Player 3", isHuman: false },
          { name: "AI Player 4", isHuman: false },
        ],
      });
      freshGameManager.startGame(); // Still in BIDDING phase

      const state = freshGameManager.getGameState();
      const currentPlayer = state.players[state.currentHand.currentPlayerIndex];
      const cardToPlay = currentPlayer.hand[0];

      const result = freshGameManager.playCard(currentPlayer.id, cardToPlay.id);

      expect(result).toBe(false);
    });

    it("should reject playing a card not in player hand", () => {
      const state = gameManager.getGameState();
      const currentPlayer = state.players[state.currentHand.currentPlayerIndex];

      // Use a fake card ID that definitely won't exist
      const result = gameManager.playCard(currentPlayer.id, "fake_nonexistent_card_id");

      expect(result).toBe(false);
    });
  });

  describe("Trump Suit Establishment", () => {
    it("should establish trump suit when bid winner plays first card", () => {
      const state = gameManager.getGameState();
      const bidWinner = state.players[state.currentHand.currentPlayerIndex];
      const firstCard = bidWinner.hand.find((card) => !card.isJoker);
      if (!firstCard) throw new Error("No non-joker card found in hand");

      gameManager.playCard(bidWinner.id, firstCard.id);

      const updatedState = gameManager.getGameState();
      expect(updatedState.currentHand.trumpSuit).toBe(firstCard.suit);
      expect(mockEventEmitter).toHaveBeenCalledWith("trumpEstablished", firstCard.suit);
    });

    it("should prevent joker from being played as first card", () => {
      const state = gameManager.getGameState();
      const bidWinner = state.players[state.currentHand.currentPlayerIndex];

      // Add a joker to the bid winner's hand for testing
      const joker = new Card(null, Rank.JOKER);
      bidWinner.hand.push(joker);

      const result = gameManager.playCard(bidWinner.id, joker.id);

      expect(result).toBe(false);
      expect(mockEventEmitter).toHaveBeenCalledWith("invalidPlay", {
        reason: "Joker cannot be led as first card",
        playerId: bidWinner.id,
        cardId: joker.id,
      });
    });

    it("should allow joker after trump is established", () => {
      const state = gameManager.getGameState();
      const bidWinner = state.players[state.currentHand.currentPlayerIndex];

      // First, establish trump with a regular card
      const firstCard = bidWinner.hand.find((card) => !card.isJoker);
      if (!firstCard) throw new Error("No non-joker card found in hand");
      gameManager.playCard(bidWinner.id, firstCard.id);

      // Move to next player and try joker
      const updatedState = gameManager.getGameState();
      const nextPlayer = updatedState.players[updatedState.currentHand.currentPlayerIndex];
      const joker = new Card(null, Rank.JOKER);
      nextPlayer.hand.push(joker);

      const result = gameManager.playCard(nextPlayer.id, joker.id);

      expect(result).toBe(true);
    });
  });

  describe("Suit Following Rules", () => {
    beforeEach(() => {
      // Establish trump first
      const state = gameManager.getGameState();
      const bidWinner = state.players[state.currentHand.currentPlayerIndex];
      const trumpCard = bidWinner.hand.find((card) => card.suit && !card.isJoker) || bidWinner.hand[0];
      gameManager.playCard(bidWinner.id, trumpCard.id);
    });

    it("should allow following lead suit when player has that suit", () => {
      const state = gameManager.getGameState();
      const currentPlayer = state.players[state.currentHand.currentPlayerIndex];
      const leadSuit = state.currentHand.currentTrick?.leadSuit;

      // Find a card of the lead suit in player's hand
      const followingCard = currentPlayer.hand.find((card) => card.suit === leadSuit);

      if (followingCard) {
        const result = gameManager.playCard(currentPlayer.id, followingCard.id);
        expect(result).toBe(true);
      }
    });

    it("should reject off-suit play when player has lead suit cards", () => {
      const state = gameManager.getGameState();
      const currentPlayer = state.players[state.currentHand.currentPlayerIndex];
      const leadSuit = state.currentHand.currentTrick?.leadSuit;
      if (!leadSuit) throw new Error("No lead suit found in current trick");

      // Manually set up hand with lead suit cards
      currentPlayer.hand = [
        new Card(leadSuit, Rank.KING), // Has lead suit
        new Card(Suit.SPADES, Rank.QUEEN), // Off-suit card
      ];

      const offSuitCard = currentPlayer.hand[1];
      const result = gameManager.playCard(currentPlayer.id, offSuitCard.id);

      expect(result).toBe(false);
      expect(mockEventEmitter).toHaveBeenCalledWith("invalidPlay", {
        reason: "Must follow lead suit when possible",
        playerId: currentPlayer.id,
        cardId: offSuitCard.id,
      });
    });

    it("should allow any card when player has no lead suit cards", () => {
      const state = gameManager.getGameState();
      const currentPlayer = state.players[state.currentHand.currentPlayerIndex];
      const leadSuit = state.currentHand.currentTrick?.leadSuit;

      // Set up hand with no lead suit cards
      const otherSuits = [Suit.CLUBS, Suit.DIAMONDS, Suit.SPADES].filter((s) => s !== leadSuit);
      currentPlayer.hand = [new Card(otherSuits[0], Rank.KING), new Card(otherSuits[1], Rank.QUEEN)];

      const anyCard = currentPlayer.hand[0];
      const result = gameManager.playCard(currentPlayer.id, anyCard.id);

      expect(result).toBe(true);
    });
  });

  describe("Game State Updates", () => {
    it("should update currentTrick with played card", () => {
      const state = gameManager.getGameState();
      const currentPlayer = state.players[state.currentHand.currentPlayerIndex];
      // Ensure we use a non-joker card for the first play
      const cardToPlay = currentPlayer.hand.find((card) => !card.isJoker) || currentPlayer.hand[0];
      const initialTrickCards = state.currentHand.currentTrick?.cards.length || 0;

      gameManager.playCard(currentPlayer.id, cardToPlay.id);

      const updatedState = gameManager.getGameState();
      expect(updatedState.currentHand.currentTrick?.cards.length).toBe(initialTrickCards + 1);

      const playedCardEntry = updatedState.currentHand.currentTrick?.cards.find(
        (entry) => entry.playerId === currentPlayer.id
      );
      expect(playedCardEntry).toBeDefined();
      expect(playedCardEntry?.card.id).toBe(cardToPlay.id);
    });

    it("should remove card from player hand", () => {
      const state = gameManager.getGameState();
      const currentPlayer = state.players[state.currentHand.currentPlayerIndex];
      // Ensure we use a non-joker card for the first play
      const cardToPlay = currentPlayer.hand.find((card) => !card.isJoker) || currentPlayer.hand[0];
      const initialHandSize = currentPlayer.hand.length;
      const cardId = cardToPlay.id;

      gameManager.playCard(currentPlayer.id, cardToPlay.id);

      // The currentPlayer reference is the same object, so check it directly
      expect(currentPlayer.hand.length).toBe(initialHandSize - 1);
      expect(currentPlayer.hand.find((card) => card.id === cardId)).toBeUndefined();
    });

    it("should advance to next player after valid play", () => {
      const state = gameManager.getGameState();
      const currentPlayerIndex = state.currentHand.currentPlayerIndex;
      const currentPlayer = state.players[currentPlayerIndex];
      // Ensure we use a non-joker card for the first play
      const cardToPlay = currentPlayer.hand.find((card) => !card.isJoker) || currentPlayer.hand[0];

      gameManager.playCard(currentPlayer.id, cardToPlay.id);

      const updatedState = gameManager.getGameState();
      const expectedNextIndex = (currentPlayerIndex + 1) % 4;
      expect(updatedState.currentHand.currentPlayerIndex).toBe(expectedNextIndex);
    });

    it("should emit proper events for UI updates", () => {
      const state = gameManager.getGameState();
      const currentPlayer = state.players[state.currentHand.currentPlayerIndex];
      // Ensure we use a non-joker card for the first play
      const cardToPlay = currentPlayer.hand.find((card) => !card.isJoker) || currentPlayer.hand[0];

      gameManager.playCard(currentPlayer.id, cardToPlay.id);

      expect(mockEventEmitter).toHaveBeenCalledWith("cardPlayed", {
        playerId: currentPlayer.id,
        card: cardToPlay,
        trickState: expect.any(Object),
      });

      expect(mockEventEmitter).toHaveBeenCalledWith("gameStateUpdated", expect.any(Object));
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty hand gracefully", () => {
      const state = gameManager.getGameState();
      const currentPlayer = state.players[state.currentHand.currentPlayerIndex];

      // Empty the player's hand
      currentPlayer.hand = [];

      const result = gameManager.playCard(currentPlayer.id, "nonexistent_card");

      expect(result).toBe(false);
      expect(mockEventEmitter).toHaveBeenCalledWith("invalidPlay", {
        reason: "Card not found in player hand",
        playerId: currentPlayer.id,
        cardId: "nonexistent_card",
      });
    });

    it("should handle duplicate card play attempts", () => {
      const state = gameManager.getGameState();
      const currentPlayer = state.players[state.currentHand.currentPlayerIndex];
      const cardToPlay = currentPlayer.hand[0];

      // Play the card once
      gameManager.playCard(currentPlayer.id, cardToPlay.id);

      // Try to play the same card again (should fail)
      const result = gameManager.playCard(currentPlayer.id, cardToPlay.id);

      expect(result).toBe(false);
    });

    it("should complete trick when 4 cards are played", () => {
      // Start fresh to avoid conflicts with setup
      const freshGameManager = new GameManager({
        targetScore: 21,
        players: [
          { name: "Player 1", isHuman: true },
          { name: "AI Player 2", isHuman: false },
          { name: "AI Player 3", isHuman: false },
          { name: "AI Player 4", isHuman: false },
        ],
      });

      freshGameManager.startGame();

      // Complete a full bidding round: first player bids 3, rest pass
      let state = freshGameManager.getGameState();
      let currentPlayer = state.players[state.currentHand.currentPlayerIndex];
      freshGameManager.placeBid(currentPlayer.id, 3); // First player bids 3

      // Next 3 players pass
      for (let i = 0; i < 3; i++) {
        state = freshGameManager.getGameState();
        currentPlayer = state.players[state.currentHand.currentPlayerIndex];
        freshGameManager.placeBid(currentPlayer.id, null); // Pass
      }

      const mockFreshEmitter = vi.spyOn(freshGameManager, "emit");

      // Helper function to find a valid card to play
      const findValidCard = (player: any, gameState: any): any => {
        const trick = gameState.currentHand.currentTrick;
        const trumpSuit = gameState.currentHand.trumpSuit;

        if (!trick || trick.cards.length === 0) {
          // First card - use any non-joker
          return player.hand.find((card: any) => !card.isJoker) || player.hand[0];
        }

        const leadSuit = trick.leadSuit;

        // Find card that can follow the lead suit
        return player.hand.find((card: any) => card.canFollow(leadSuit, player.hand, trumpSuit)) || player.hand[0];
      };

      // Play 4 cards in sequence
      for (let i = 0; i < 4; i++) {
        const currentState = freshGameManager.getGameState();
        const currentPlayer = currentState.players[currentState.currentHand.currentPlayerIndex];
        const cardToPlay = findValidCard(currentPlayer, currentState);

        const success = freshGameManager.playCard(currentPlayer.id, cardToPlay.id);
        if (!success) {
          console.log(`Failed to play card ${cardToPlay.id} for player ${currentPlayer.name} on turn ${i}`);
          break;
        }
      }

      // After 4 cards, trick should be complete
      expect(mockFreshEmitter).toHaveBeenCalledWith("trickComplete", expect.any(Object));
    });
  });
});
