import { beforeEach, describe, expect, it, vi } from "vitest";
import { Card } from "@/entities/Card";
import { Rank, Suit } from "@/types/game";
import { GameManager } from "./GameManager";

describe("GameManager - Trick-Taking Logic (SB-002)", () => {
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

    // Mock event emissions to verify they're called
    mockEventEmitter = vi.spyOn(gameManager, "emit");
  });

  describe("Trump Hierarchy - Card.compareForTrump()", () => {
    it("should rank joker as highest trump", () => {
      const joker = new Card(null, Rank.JOKER);
      const trumpAce = new Card(Suit.HEARTS, Rank.ACE);
      const trumpJack = new Card(Suit.HEARTS, Rank.JACK);

      expect(joker.compareForTrump(trumpAce, Suit.HEARTS)).toBeGreaterThan(0);
      expect(joker.compareForTrump(trumpJack, Suit.HEARTS)).toBeGreaterThan(0);
    });

    it("should rank jack of trump as second highest trump", () => {
      const trumpJack = new Card(Suit.HEARTS, Rank.JACK);
      const offJack = new Card(Suit.DIAMONDS, Rank.JACK); // Same color as hearts
      const trumpAce = new Card(Suit.HEARTS, Rank.ACE);

      expect(trumpJack.compareForTrump(offJack, Suit.HEARTS)).toBeGreaterThan(0);
      expect(trumpJack.compareForTrump(trumpAce, Suit.HEARTS)).toBeGreaterThan(0);
    });

    it("should rank off-jack as third highest trump", () => {
      const offJack = new Card(Suit.DIAMONDS, Rank.JACK); // Same color as hearts trump
      const trumpAce = new Card(Suit.HEARTS, Rank.ACE);
      const trumpKing = new Card(Suit.HEARTS, Rank.KING);

      expect(offJack.compareForTrump(trumpAce, Suit.HEARTS)).toBeGreaterThan(0);
      expect(offJack.compareForTrump(trumpKing, Suit.HEARTS)).toBeGreaterThan(0);
    });

    it("should properly identify off-jack based on color", () => {
      // Hearts trump - diamonds jack should be off-jack
      const diamondsJack = new Card(Suit.DIAMONDS, Rank.JACK);
      expect(diamondsJack.isOffJack(Suit.HEARTS)).toBe(true);
      expect(diamondsJack.isTrump(Suit.HEARTS)).toBe(true);

      // Hearts trump - clubs jack should NOT be off-jack (different color)
      const clubsJack = new Card(Suit.CLUBS, Rank.JACK);
      expect(clubsJack.isOffJack(Suit.HEARTS)).toBe(false);
      expect(clubsJack.isTrump(Suit.HEARTS)).toBe(false);
    });

    it("should rank trump cards by rank within trump suit", () => {
      const trumpAce = new Card(Suit.HEARTS, Rank.ACE);
      const trumpKing = new Card(Suit.HEARTS, Rank.KING);
      const trumpTwo = new Card(Suit.HEARTS, Rank.TWO);

      expect(trumpAce.compareForTrump(trumpKing, Suit.HEARTS)).toBeGreaterThan(0);
      expect(trumpKing.compareForTrump(trumpTwo, Suit.HEARTS)).toBeGreaterThan(0);
    });

    it("should ensure trump always beats non-trump", () => {
      const trumpTwo = new Card(Suit.HEARTS, Rank.TWO); // Lowest trump
      const nonTrumpAce = new Card(Suit.SPADES, Rank.ACE); // Highest non-trump

      expect(trumpTwo.compareForTrump(nonTrumpAce, Suit.HEARTS)).toBeGreaterThan(0);
    });
  });

  describe("Trick Evaluation", () => {
    beforeEach(() => {
      // Establish trump suit by playing first card
      const state = gameManager.getGameState();
      const bidWinner = state.players[state.currentHand.currentPlayerIndex];
      const trumpCard = new Card(Suit.HEARTS, Rank.KING);
      bidWinner.hand = [trumpCard, ...bidWinner.hand.slice(1)];
      gameManager.playCard(bidWinner.id, trumpCard.id);
    });

    it("should determine winner when trump card is played", () => {
      // Helper function that ensures no suit conflicts
      const playCardSafely = (card: Card): string => {
        const currentState = gameManager.getGameState();
        const currentPlayer = currentState.players[currentState.currentHand.currentPlayerIndex];
        // Clear hand and set only the card we want to play (ensures no suit-following conflicts)
        currentPlayer.hand = [card];
        gameManager.playCard(currentPlayer.id, card.id);
        return currentPlayer.id;
      };

      // Player 2: Play non-trump (can't follow lead suit hearts)
      playCardSafely(new Card(Suit.SPADES, Rank.KING));

      // Player 3: Play trump card (should win)
      const winnerId = playCardSafely(new Card(Suit.HEARTS, Rank.ACE)); // High trump beats other trump

      // Player 4: Play another non-trump
      playCardSafely(new Card(Suit.CLUBS, Rank.ACE));

      // Check that trick is complete and trump card won
      expect(mockEventEmitter).toHaveBeenCalledWith("trickComplete", expect.any(Object));
      const completedTricks = gameManager.getGameState().currentHand.tricks;
      expect(completedTricks.length).toBe(1);
      expect(completedTricks[0].winner).toBe(winnerId);
    });

    it("should determine winner with joker present", () => {
      const state = gameManager.getGameState();
      const players = state.players;
      const currentPlayerIndex = state.currentHand.currentPlayerIndex;

      // Player 2: Play trump jack
      const player2 = players[currentPlayerIndex];
      const trumpJack = new Card(Suit.HEARTS, Rank.JACK);
      player2.hand = [trumpJack, ...player2.hand.slice(1)];
      gameManager.playCard(player2.id, trumpJack.id);

      // Player 3: Play joker (should win)
      const player3Index = gameManager.getGameState().currentHand.currentPlayerIndex;
      const player3 = players[player3Index];
      const joker = new Card(null, Rank.JOKER);
      player3.hand = [joker, ...player3.hand.slice(1)];
      gameManager.playCard(player3.id, joker.id);

      // Player 4: Play off-jack
      const player4Index = gameManager.getGameState().currentHand.currentPlayerIndex;
      const player4 = players[player4Index];
      const offJack = new Card(Suit.DIAMONDS, Rank.JACK); // Same color as hearts
      player4.hand = [offJack, ...player4.hand.slice(1)];
      gameManager.playCard(player4.id, offJack.id);

      // Check that joker won
      const completedTricks = gameManager.getGameState().currentHand.tricks;
      expect(completedTricks[0].winner).toBe(player3.id);
    });

    it("should determine winner when no trump cards played", () => {
      // Helper function that ensures no suit conflicts
      const playCardSafely = (card: Card): string => {
        const currentState = gameManager.getGameState();
        const currentPlayer = currentState.players[currentState.currentHand.currentPlayerIndex];
        // Clear hand and set only the card we want to play (ensures no suit-following conflicts)
        currentPlayer.hand = [card];
        gameManager.playCard(currentPlayer.id, card.id);
        return currentPlayer.id;
      };

      const leadSuit = gameManager.getGameState().currentHand.currentTrick?.leadSuit; // Hearts from first card
      if (!leadSuit) throw new Error("No lead suit found");

      // Player 2: Follow lead suit with lower card
      playCardSafely(new Card(leadSuit, Rank.FIVE));

      // Player 3: Play off-suit card (no hearts in hand)
      playCardSafely(new Card(Suit.CLUBS, Rank.ACE));

      // Player 4: Follow lead suit with highest card (should win)
      const winnerId = playCardSafely(new Card(leadSuit, Rank.ACE));

      // Check that highest lead suit card won
      const completedTricks = gameManager.getGameState().currentHand.tricks;
      expect(completedTricks.length).toBe(1);
      expect(completedTricks[0].winner).toBe(winnerId);
    });

    describe("Edge Cases", () => {
      it("should handle multiple trump cards in same trick", () => {
        // Helper function that ensures no suit conflicts
        const playCardSafely = (card: Card): string => {
          const currentState = gameManager.getGameState();
          const currentPlayer = currentState.players[currentState.currentHand.currentPlayerIndex];
          // Clear hand and set only the card we want to play (ensures no suit-following conflicts)
          currentPlayer.hand = [card];
          gameManager.playCard(currentPlayer.id, card.id);
          return currentPlayer.id;
        };

        // Player 1 already played Hearts King in beforeEach
        // Player 2: Play low trump
        playCardSafely(new Card(Suit.HEARTS, Rank.THREE));

        // Player 3: Play high trump (should win over King)
        const winnerId = playCardSafely(new Card(Suit.HEARTS, Rank.ACE));

        // Player 4: Play medium trump
        playCardSafely(new Card(Suit.HEARTS, Rank.TEN));

        // Check that highest trump won (Ace should beat King, Ten, and Three)
        const completedTricks = gameManager.getGameState().currentHand.tricks;
        expect(completedTricks.length).toBe(1);
        expect(completedTricks[0].winner).toBe(winnerId);
      });

      it("should handle off-jack vs trump jack hierarchy", () => {
        // Helper function that ensures no suit conflicts
        const playCardSafely = (card: Card): string => {
          const currentState = gameManager.getGameState();
          const currentPlayer = currentState.players[currentState.currentHand.currentPlayerIndex];
          // Clear hand and set only the card we want to play (ensures no suit-following conflicts)
          currentPlayer.hand = [card];
          gameManager.playCard(currentPlayer.id, card.id);
          return currentPlayer.id;
        };

        // Player 1 already played Hearts King in beforeEach
        // Player 2: Play off-jack (diamonds when hearts are trump)
        playCardSafely(new Card(Suit.DIAMONDS, Rank.JACK));

        // Player 3: Play trump jack (should win over off-jack and King)
        const winnerId = playCardSafely(new Card(Suit.HEARTS, Rank.JACK));

        // Player 4: Play regular trump
        playCardSafely(new Card(Suit.HEARTS, Rank.QUEEN));

        // Check that trump jack won over off-jack (hierarchy: Jack of trump > off-jack > other trump)
        const completedTricks = gameManager.getGameState().currentHand.tricks;
        expect(completedTricks.length).toBe(1);
        expect(completedTricks[0].winner).toBe(winnerId);
      });

      it("should throw error if evaluating incomplete trick", () => {
        // This test accesses private method through type assertion for testing
        const gameManagerAny = gameManager as any;

        // Create a trick with only 2 cards
        const incompleteTrick = {
          id: "test_trick",
          cards: [
            { playerId: "player1", card: new Card(Suit.HEARTS, Rank.KING) },
            { playerId: "player2", card: new Card(Suit.SPADES, Rank.ACE) },
          ],
          winner: "",
          leadSuit: Suit.HEARTS,
        };

        expect(() => {
          gameManagerAny.evaluateTrick(incompleteTrick);
        }).toThrow("Trick must have exactly 4 cards to evaluate");
      });
    });
  });

  describe("Trick Winner Leads Next Trick", () => {
    it("should set trick winner as leader of next trick", () => {
      // Establish trump suit by playing first card
      const state = gameManager.getGameState();
      const bidWinner = state.players[state.currentHand.currentPlayerIndex];
      const trumpCard = new Card(Suit.HEARTS, Rank.KING);
      bidWinner.hand = [trumpCard, ...bidWinner.hand.slice(1)];
      gameManager.playCard(bidWinner.id, trumpCard.id);

      // Complete the rest of the trick with specific cards to avoid suit conflicts
      const cardsToPlay = [
        new Card(Suit.HEARTS, Rank.THREE), // Follows lead suit
        new Card(Suit.SPADES, Rank.ACE), // Off-suit when no hearts
        new Card(Suit.CLUBS, Rank.KING), // Off-suit when no hearts
      ];

      for (let i = 0; i < 3; i++) {
        const currentState = gameManager.getGameState();
        const currentPlayer = currentState.players[currentState.currentHand.currentPlayerIndex];
        // Set player's hand to just the card we want to play
        currentPlayer.hand = [cardsToPlay[i]];
        gameManager.playCard(currentPlayer.id, cardsToPlay[i].id);
      }

      // Check that trick winner is now the current player
      const finalState = gameManager.getGameState();
      const completedTrick = finalState.currentHand.tricks[0];
      const expectedWinnerId = completedTrick.winner;
      const expectedWinnerIndex = finalState.players.findIndex((p) => p.id === expectedWinnerId);

      expect(finalState.currentHand.currentPlayerIndex).toBe(expectedWinnerIndex);
      expect(mockEventEmitter).toHaveBeenCalledWith("nextTrickStarted", expectedWinnerId);
    });
  });

  describe("Hand Completion Detection", () => {
    it("should detect when hand is complete after 6 tricks", () => {
      // Establish trump suit by playing first card
      let currentState = gameManager.getGameState();
      const bidWinner = currentState.players[currentState.currentHand.currentPlayerIndex];
      const trumpCard = new Card(Suit.HEARTS, Rank.KING);
      bidWinner.hand = [trumpCard, ...bidWinner.hand.slice(1)];
      gameManager.playCard(bidWinner.id, trumpCard.id);

      // Complete the first trick (3 more cards needed)
      const firstTrickCards = [
        new Card(Suit.HEARTS, Rank.THREE), // Follows lead suit
        new Card(Suit.SPADES, Rank.ACE), // Off-suit when no hearts
        new Card(Suit.CLUBS, Rank.QUEEN), // Off-suit when no hearts
      ];

      for (let i = 0; i < 3; i++) {
        currentState = gameManager.getGameState();
        const currentPlayer = currentState.players[currentState.currentHand.currentPlayerIndex];
        currentPlayer.hand = [firstTrickCards[i]];
        gameManager.playCard(currentPlayer.id, firstTrickCards[i].id);
      }

      // Simulate playing 5 more complete tricks (20 more cards)
      for (let trick = 0; trick < 5; trick++) {
        // Play 4 cards for each trick
        for (let card = 0; card < 4; card++) {
          currentState = gameManager.getGameState();
          const currentPlayer = currentState.players[currentState.currentHand.currentPlayerIndex];

          // Create a card that can be played
          const cardToPlay = new Card(Suit.DIAMONDS, Rank.TWO + card); // Simple progression
          currentPlayer.hand = [cardToPlay];
          gameManager.playCard(currentPlayer.id, cardToPlay.id);
        }
      }

      // Verify hand completion was detected
      expect(currentState.currentHand.tricks.length).toBe(6);
      expect(mockEventEmitter).toHaveBeenCalledWith("handComplete", expect.any(Object));
    });
  });
});
