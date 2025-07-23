import { EventEmitter } from "events";
import type { Card } from "@/entities/Card";
import { Deck } from "@/entities/Deck";
import {
  type Bid,
  type GameConfig,
  GamePhase,
  type GameState,
  type HandScoreResult,
  type Partnership,
  type Player,
  PlayerPosition,
  Suit,
  type Trick,
} from "@/types/game";

export class GameManager extends EventEmitter {
  private gameState: GameState;
  private deck: Deck;
  private config: GameConfig;

  constructor(config: GameConfig) {
    super();
    this.config = config;
    this.deck = new Deck();
    this.gameState = this.initializeGameState();
  }

  /**
   * Initialize the game state
   */
  private initializeGameState(): GameState {
    const players = this.createPlayers();
    const partnerships = this.createPartnerships(players);

    return {
      players,
      partnerships,
      currentHand: {
        trumpSuit: null,
        currentBid: null,
        biddingPhase: false,
        currentPlayerIndex: 0,
        tricks: [],
        currentTrick: null,
        bids: [],
      },
      deck: [],
      gamePhase: GamePhase.SETUP,
      winner: null,
    };
  }

  /**
   * Create players based on config
   */
  private createPlayers(): Player[] {
    const positions = [PlayerPosition.SOUTH, PlayerPosition.WEST, PlayerPosition.NORTH, PlayerPosition.EAST];

    return this.config.players.map((playerConfig, index) => ({
      id: `player_${index}`,
      name: playerConfig.name,
      hand: [],
      position: positions[index],
      partnerId: index < 2 ? `player_${index + 2}` : `player_${index - 2}`, // N/S and E/W partnerships
      isHuman: playerConfig.isHuman,
      isDealer: index === 0, // First player starts as dealer
    }));
  }

  /**
   * Create partnerships (North/South vs East/West)
   */
  private createPartnerships(players: Player[]): Partnership[] {
    const northPlayer = players.find((p) => p.position === PlayerPosition.NORTH);
    const southPlayer = players.find((p) => p.position === PlayerPosition.SOUTH);
    const eastPlayer = players.find((p) => p.position === PlayerPosition.EAST);
    const westPlayer = players.find((p) => p.position === PlayerPosition.WEST);

    if (!northPlayer || !southPlayer || !eastPlayer || !westPlayer) {
      throw new Error("Missing required player positions");
    }

    return [
      {
        id: "ns_partnership",
        player1Id: northPlayer.id,
        player2Id: southPlayer.id,
        score: 0,
      },
      {
        id: "ew_partnership",
        player1Id: eastPlayer.id,
        player2Id: westPlayer.id,
        score: 0,
      },
    ];
  }

  /**
   * Start a new game
   */
  startGame(): void {
    console.log("🎮 GameManager.startGame() called");
    this.gameState.gamePhase = GamePhase.DEALING;
    this.dealHand();
    console.log("🎮 Emitting gameStarted event");
    this.emit("gameStarted", this.gameState);
  }

  /**
   * Deal 6 cards to each player from continuous 53-card deck
   */
  private dealHand(): void {
    const cardsNeeded = this.gameState.players.length * 6; // 24 cards for 4 players

    console.log("🎮 Dealing new hand...");
    console.log("🎮 Cards remaining in deck:", this.deck.remainingCards);
    console.log("🎮 Cards needed:", cardsNeeded);

    // Check if we need to reshuffle (not enough cards for a complete hand)
    if (this.deck.remainingCards < cardsNeeded) {
      console.log("🎮 Not enough cards remaining, reshuffling deck...");
      this.deck.reset();
      this.emit("deckReshuffled", {
        remainingCards: this.deck.remainingCards,
        cardsNeeded,
      });
    }

    // Clear all hands
    this.gameState.players.forEach((player) => {
      player.hand = [];
    });

    // Deal 6 cards to each player
    for (let i = 0; i < 6; i++) {
      this.gameState.players.forEach((player) => {
        const card = this.deck.dealCard();
        if (card) {
          player.hand.push(card);
        } else {
          console.error("🚨 CRITICAL: Failed to deal card - deck should have enough cards!");
        }
      });
    }

    // Sort hands
    this.gameState.players.forEach((player) => {
      this.sortHand(player.hand);
    });

    console.log("🎮 Cards dealt successfully");
    console.log("🎮 Deck now has", this.deck.remainingCards, "cards remaining");
    console.log("🎮 Starting bidding...");
    this.startBidding();
  }

  /**
   * Sort a hand by suit and rank
   */
  private sortHand(hand: Card[]): void {
    hand.sort((a, b) => {
      if (a.isJoker) return -1;
      if (b.isJoker) return 1;
      if (a.suit !== b.suit && a.suit && b.suit) {
        return (a.suit as string).localeCompare(b.suit as string);
      }
      return a.rank - b.rank;
    });
  }

  /**
   * Start the bidding phase
   */
  private startBidding(): void {
    console.log("🎯 GameManager.startBidding() called");
    this.gameState.gamePhase = GamePhase.BIDDING;
    this.gameState.currentHand.biddingPhase = true;
    this.gameState.currentHand.currentBid = null;
    this.gameState.currentHand.bids = []; // Clear any previous bids

    // Bidding starts with player to the left of dealer
    const dealerIndex = this.gameState.players.findIndex((p) => p.isDealer);
    this.gameState.currentHand.currentPlayerIndex = (dealerIndex + 1) % 4;

    const currentPlayer = this.gameState.players[this.gameState.currentHand.currentPlayerIndex];
    console.log("🎯 Bidding starts with:", currentPlayer.name, "isHuman:", currentPlayer.isHuman);
    console.log("🎯 Emitting biddingStarted event");
    this.emit("biddingStarted", this.gameState);
  }

  /**
   * Process a bid from a player
   */
  placeBid(playerId: string, bidAmount: number | null): boolean {
    if (this.gameState.gamePhase !== GamePhase.BIDDING) {
      return false;
    }

    const player = this.gameState.players[this.gameState.currentHand.currentPlayerIndex];
    if (player.id !== playerId) {
      return false; // Not this player's turn
    }

    const bid: Bid = {
      playerId,
      amount: bidAmount || 0,
      passed: bidAmount === null,
    };

    // Validate bid
    if (!bid.passed) {
      if (bidAmount === null || bidAmount < 2 || bidAmount > 6) {
        return false; // Invalid bid amount
      }
      const currentBid = this.gameState.currentHand.currentBid;
      if (currentBid && bidAmount <= currentBid.amount) {
        return false; // Bid too low
      }
    }

    // Initialize bids array if it doesn't exist
    if (!this.gameState.currentHand.bids) {
      this.gameState.currentHand.bids = [];
    }

    // Add the bid to the history
    this.gameState.currentHand.bids.push(bid);

    // Accept the bid
    if (!bid.passed) {
      this.gameState.currentHand.currentBid = bid;
    }

    // Move to next player
    this.gameState.currentHand.currentPlayerIndex = (this.gameState.currentHand.currentPlayerIndex + 1) % 4;

    this.emit("bidPlaced", bid, this.gameState);

    // Check if bidding is complete
    if (this.isBiddingComplete()) {
      this.endBidding();
    }

    return true;
  }

  /**
   * Check if bidding phase is complete
   */
  private isBiddingComplete(): boolean {
    // Bidding ends when:
    // 1. Someone bids 6 (shoot the moon)
    // 2. Three players pass after a bid
    // 3. All players pass (dealer gets stuck with 2)

    const currentBid = this.gameState.currentHand.currentBid;

    if (currentBid && currentBid.amount === 6) {
      return true; // Shoot the moon
    }

    // Initialize bids array if it doesn't exist
    if (!this.gameState.currentHand.bids) {
      this.gameState.currentHand.bids = [];
    }

    const bids = this.gameState.currentHand.bids;

    // If we haven't had 4 bids yet, continue bidding
    if (bids.length < 4) {
      return false;
    }

    // If all 4 players have bid, check if we have a winner
    // Bidding continues until 3 consecutive passes after a bid
    const lastFourBids = bids.slice(-4);
    const lastThreeBids = bids.slice(-3);

    // If the last 3 bids were all passes and there's a current bid, bidding is done
    if (currentBid && lastThreeBids.length === 3 && lastThreeBids.every((bid: Bid) => bid.passed)) {
      return true;
    }

    // If all 4 players passed, dealer gets stuck with 2
    if (lastFourBids.length === 4 && lastFourBids.every((bid: Bid) => bid.passed)) {
      return true;
    }

    return false;
  }

  /**
   * End bidding and start playing
   */
  private endBidding(): void {
    let finalBid = this.gameState.currentHand.currentBid;

    // If no bid was made, dealer gets stuck with 2
    if (!finalBid) {
      const dealer = this.gameState.players.find((p) => p.isDealer);
      if (!dealer) throw new Error("No dealer found");
      finalBid = {
        playerId: dealer.id,
        amount: 2,
        passed: false,
      };
      this.gameState.currentHand.currentBid = finalBid;
    }

    this.gameState.gamePhase = GamePhase.PLAYING;
    this.gameState.currentHand.biddingPhase = false;

    // Winner of bid leads first trick
    const bidWinner = this.gameState.players.find((p) => p.id === finalBid.playerId);
    if (!bidWinner) throw new Error("Bid winner not found");
    this.gameState.currentHand.currentPlayerIndex = this.gameState.players.indexOf(bidWinner);

    this.emit("biddingEnded", finalBid, this.gameState);
    this.emit("playStarted", this.gameState);
  }

  /**
   * Get current game state (read-only)
   */
  getGameState(): Readonly<GameState> {
    return this.gameState;
  }

  /**
   * Get player by ID
   */
  getPlayer(playerId: string): Player | undefined {
    return this.gameState.players.find((p) => p.id === playerId);
  }

  /**
   * Get partnership by player ID
   */
  getPartnership(playerId: string): Partnership | undefined {
    return this.gameState.partnerships.find((p) => p.player1Id === playerId || p.player2Id === playerId);
  }

  /**
   * Play a card - Core mechanic for SB-001
   */
  playCard(playerId: string, cardId: string): boolean {
    // Validate game phase
    if (this.gameState.gamePhase !== GamePhase.PLAYING) {
      this.emit("invalidPlay", {
        reason: "Not in playing phase",
        playerId,
        cardId,
      });
      return false;
    }

    // Validate current player
    const currentPlayer = this.gameState.players[this.gameState.currentHand.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      this.emit("invalidPlay", {
        reason: "Not your turn",
        playerId,
        cardId,
      });
      return false;
    }

    // Find the card in player's hand
    const cardToPlay = currentPlayer.hand.find((card) => card.id === cardId);
    if (!cardToPlay) {
      this.emit("invalidPlay", {
        reason: "Card not found in player hand",
        playerId,
        cardId,
      });
      return false;
    }

    // Validate the card play according to game rules
    if (!this.validateCardPlay(currentPlayer, cardToPlay)) {
      return false;
    }

    // Execute the card play
    this.executeCardPlay(currentPlayer, cardToPlay);

    return true;
  }

  /**
   * Validate if a card play is legal according to Setback rules
   */
  private validateCardPlay(player: Player, card: Card): boolean {
    // Special rule: Joker cannot be led as first card
    if (card.isJoker && this.gameState.currentHand.trumpSuit === null) {
      this.emit("invalidPlay", {
        reason: "Joker cannot be led as first card",
        playerId: player.id,
        cardId: card.id,
      });
      return false;
    }

    // If this is not the first card in the trick, check suit following rules
    if (this.gameState.currentHand.currentTrick && this.gameState.currentHand.currentTrick.cards.length > 0) {
      const leadSuit = this.gameState.currentHand.currentTrick.leadSuit;
      const trumpSuit = this.gameState.currentHand.trumpSuit;

      if (!card.canFollow(leadSuit, player.hand, trumpSuit)) {
        this.emit("invalidPlay", {
          reason: "Must follow lead suit when possible",
          playerId: player.id,
          cardId: card.id,
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Execute a valid card play
   */
  private executeCardPlay(player: Player, card: Card): void {
    // Remove card from player's hand
    const cardIndex = player.hand.findIndex((c) => c.id === card.id);
    player.hand.splice(cardIndex, 1);

    // Establish trump suit if this is the first card
    if (this.gameState.currentHand.trumpSuit === null && !card.isJoker) {
      this.establishTrumpSuit(card);
    }

    // Add card to current trick
    this.addCardToCurrentTrick(player.id, card);

    // Advance to next player or complete trick
    this.advanceGameState();

    // Emit events for UI updates
    this.emit("cardPlayed", {
      playerId: player.id,
      card: card,
      trickState: this.gameState.currentHand.currentTrick,
    });

    this.emit("gameStateUpdated", this.gameState);
  }

  /**
   * Establish trump suit when first card is played
   */
  private establishTrumpSuit(firstCard: Card): void {
    this.gameState.currentHand.trumpSuit = firstCard.suit;
    this.emit("trumpEstablished", firstCard.suit);
  }

  /**
   * Add a card to the current trick
   */
  private addCardToCurrentTrick(playerId: string, card: Card): void {
    // Create new trick if none exists
    if (!this.gameState.currentHand.currentTrick) {
      this.gameState.currentHand.currentTrick = {
        id: `trick_${this.gameState.currentHand.tricks.length}`,
        cards: [],
        winner: "", // Will be determined when trick is complete
        leadSuit: card.suit || Suit.HEARTS, // Fallback for joker, though it shouldn't be first
      };
    }

    // Add the card to the trick
    this.gameState.currentHand.currentTrick.cards.push({
      playerId,
      card,
    });
  }

  /**
   * Advance game state after a card is played
   */
  private advanceGameState(): void {
    const currentTrick = this.gameState.currentHand.currentTrick;
    if (!currentTrick) throw new Error("No current trick found");

    // Check if trick is complete (4 cards played)
    if (currentTrick.cards.length === 4) {
      // In test environment, complete trick immediately
      // In browser, add small delay for UI rendering
      if (typeof window === "undefined" || process.env.NODE_ENV === "test") {
        this.completeTrick();
      } else {
        // Add a brief delay to ensure UI displays the 4th card before completion
        setTimeout(() => {
          this.completeTrick();
        }, 100); // Small delay to let UI update
      }
    } else {
      // Advance to next player
      this.gameState.currentHand.currentPlayerIndex = (this.gameState.currentHand.currentPlayerIndex + 1) % 4;
    }
  }

  /**
   * Complete the current trick using proper trump hierarchy evaluation
   */
  private completeTrick(): void {
    const currentTrick = this.gameState.currentHand.currentTrick;
    if (!currentTrick) throw new Error("No current trick to complete");

    // Evaluate trick winner using trump hierarchy
    currentTrick.winner = this.evaluateTrick(currentTrick);

    // Emit trick complete immediately so UI can show the 4th card
    this.emit("trickComplete", currentTrick);

    // Move trick to completed tricks
    this.gameState.currentHand.tricks.push(currentTrick);
    this.gameState.currentHand.currentTrick = null;

    // Check if hand is complete (6 tricks played)
    const tricksCompleted = this.gameState.currentHand.tricks.length;
    const isComplete = this.isHandComplete();

    console.log("🎮 After trick completion:");
    console.log("🎮   Tricks completed:", tricksCompleted);
    console.log("🎮   Hand complete?", isComplete);
    console.log(
      "🎮   Player hands:",
      this.gameState.players.map((p) => `${p.name}: ${p.hand.length} cards`)
    );

    if (isComplete) {
      console.log("🎮 Hand is complete, calling completeHand()");
      this.completeHand();
    } else {
      console.log("🎮 Hand not complete, starting next trick with winner:", currentTrick.winner);
      // Winner of trick leads next trick
      this.startNextTrick(currentTrick.winner);
    }
  }

  /**
   * Evaluate trick winner based on Setback trump hierarchy rules
   * Returns the player ID of the trick winner
   */
  private evaluateTrick(trick: Trick): string {
    if (trick.cards.length !== 4) {
      throw new Error("Trick must have exactly 4 cards to evaluate");
    }

    const trumpSuit = this.gameState.currentHand.trumpSuit;
    let winningCard = trick.cards[0];

    console.log("🎮 Evaluating trick with cards:");
    trick.cards.forEach((cardPlay, index) => {
      const player = this.gameState.players.find((p) => p.id === cardPlay.playerId);
      console.log(`🎮   ${index}: ${player?.name} played ${cardPlay.card.toString()}`);
    });

    // Compare each card to find the highest
    for (let i = 1; i < trick.cards.length; i++) {
      const currentCard = trick.cards[i];

      // If current card beats the winning card, update winner
      if (this.compareCardsForTrick(currentCard.card, winningCard.card, trumpSuit, trick.leadSuit)) {
        winningCard = currentCard;
      }
    }

    const winner = this.gameState.players.find((p) => p.id === winningCard.playerId);
    console.log("🎮 Trick winner determined:", winner?.name, "ID:", winningCard.playerId);

    return winningCard.playerId;
  }

  /**
   * Compare two cards for trick evaluation
   * Returns true if card1 beats card2
   */
  private compareCardsForTrick(card1: Card, card2: Card, trumpSuit: Suit | null, leadSuit: Suit): boolean {
    const card1IsTrump = card1.isTrump(trumpSuit);
    const card2IsTrump = card2.isTrump(trumpSuit);

    // Trump always beats non-trump
    if (card1IsTrump && !card2IsTrump) return true;
    if (!card1IsTrump && card2IsTrump) return false;

    // If both are trump, use trump hierarchy comparison
    if (card1IsTrump && card2IsTrump) {
      return card1.compareForTrump(card2, trumpSuit) > 0;
    }

    // If neither is trump, only lead suit can win
    const card1FollowsLead = card1.suit === leadSuit;
    const card2FollowsLead = card2.suit === leadSuit;

    // Lead suit beats off-suit
    if (card1FollowsLead && !card2FollowsLead) return true;
    if (!card1FollowsLead && card2FollowsLead) return false;

    // If both follow lead suit (or both are off-suit), compare by rank
    return card1.rank > card2.rank;
  }

  /**
   * Start the next trick with the specified winner as leader
   */
  private startNextTrick(winnerId: string): void {
    const winnerIndex = this.gameState.players.findIndex((p) => p.id === winnerId);
    const winner = this.gameState.players[winnerIndex];

    console.log("🎮 GameManager.startNextTrick() called");
    console.log("🎮 Winner ID:", winnerId);
    console.log("🎮 Winner index:", winnerIndex);
    console.log("🎮 Winner name:", winner?.name);
    console.log("🎮 Winner isHuman:", winner?.isHuman);
    console.log("🎮 Setting currentPlayerIndex to:", winnerIndex);

    this.gameState.currentHand.currentPlayerIndex = winnerIndex;

    console.log("🎮 Updated currentPlayerIndex:", this.gameState.currentHand.currentPlayerIndex);
    console.log(
      "🎮 Current player after update:",
      this.gameState.players[this.gameState.currentHand.currentPlayerIndex]?.name
    );

    this.emit("nextTrickStarted", winnerId);
  }

  /**
   * Check if the current hand is complete (all 6 tricks played)
   */
  private isHandComplete(): boolean {
    const tricksCount = this.gameState.currentHand.tricks.length;
    const isComplete = tricksCount >= 6;
    console.log("🎮 isHandComplete() called:");
    console.log("🎮   Tricks in array:", tricksCount);
    console.log("🎮   Is complete?", isComplete);
    console.log(
      "🎮   Tricks array:",
      this.gameState.currentHand.tricks.map((t) => t.id)
    );
    return isComplete;
  }

  /**
   * Complete the current hand and transition to scoring
   */
  private completeHand(): void {
    this.gameState.gamePhase = GamePhase.SCORING;
    this.emit("handCompleted", this.gameState.currentHand);

    // Trigger scoring phase
    this.scoreHand();

    // For now, check if game should end or prepare next hand
    if (this.checkGameEnd()) {
      this.gameState.gamePhase = GamePhase.GAME_OVER;
      this.emit("gameEnded", this.gameState.winner);
    } else {
      // In test environment, don't automatically start next hand
      // This allows tests to inspect the completed hand state
      if (typeof window === "undefined" || process.env.NODE_ENV === "test") {
        // Just emit the hand complete event, don't reset state
        this.emit("handComplete", this.gameState.currentHand);
      } else {
        // In browser, automatically prepare next hand
        this.prepareNextHand();
      }
    }
  }

  /**
   * Score the completed hand according to Setback rules
   */
  private scoreHand(): void {
    console.log("🏆 Starting hand scoring...");

    if (!this.gameState.currentHand.currentBid) {
      throw new Error("Cannot score hand without a bid");
    }

    if (!this.gameState.currentHand.trumpSuit) {
      throw new Error("Cannot score hand without trump suit");
    }

    const scoreResult = this.calculateHandScore();
    console.log("🏆 Score calculation complete:", scoreResult);

    this.updatePartnershipScores(scoreResult);
    this.emit("handScored", scoreResult);
  }

  /**
   * Calculate all scoring categories for the completed hand
   */
  private calculateHandScore(): HandScoreResult {
    const tricks = this.gameState.currentHand.tricks;
    const trumpSuit = this.gameState.currentHand.trumpSuit;
    const currentBid = this.gameState.currentHand.currentBid;

    if (!trumpSuit) throw new Error("Trump suit is required for scoring");
    if (!currentBid) throw new Error("Current bid is required for scoring");

    // Find bidding partnership
    const biddingPlayer = this.gameState.players.find((p) => p.id === currentBid.playerId);
    if (!biddingPlayer) throw new Error("Bidding player not found");

    const biddingPartnership = this.getPartnership(biddingPlayer.id);
    if (!biddingPartnership) throw new Error("Bidding partnership not found");

    const nonBiddingPartnership = this.gameState.partnerships.find((p) => p.id !== biddingPartnership.id);
    if (!nonBiddingPartnership) throw new Error("Non-bidding partnership not found");

    console.log(`🏆 Scoring hand with trump: ${trumpSuit}, bid: ${currentBid.amount}`);
    console.log(`🏆 Bidding partnership: ${biddingPartnership.id}`);

    // Calculate each scoring category
    const high = this.findHighestTrump(tricks, trumpSuit);
    const low = this.findLowestTrump(tricks, trumpSuit);
    const jack = this.findJackOfTrump(tricks, trumpSuit);
    const offJack = this.findOffJack(tricks, trumpSuit);
    const joker = this.findJoker(tricks);
    const game = this.calculateGamePoints(tricks);

    // Count points earned by bidding partnership
    let biddingPartnershipPoints = 0;
    if (high && high.winner === biddingPartnership.id) biddingPartnershipPoints++;
    if (low && low.winner === biddingPartnership.id) biddingPartnershipPoints++;
    if (jack && jack.winner === biddingPartnership.id) biddingPartnershipPoints++;
    if (offJack && offJack.winner === biddingPartnership.id) biddingPartnershipPoints++;
    if (joker && joker.winner === biddingPartnership.id) biddingPartnershipPoints++;
    if (game && game.winner === biddingPartnership.id) biddingPartnershipPoints++;

    // Count points earned by non-bidding partnership
    let nonBiddingPartnershipPoints = 0;
    if (high && high.winner === nonBiddingPartnership.id) nonBiddingPartnershipPoints++;
    if (low && low.winner === nonBiddingPartnership.id) nonBiddingPartnershipPoints++;
    if (jack && jack.winner === nonBiddingPartnership.id) nonBiddingPartnershipPoints++;
    if (offJack && offJack.winner === nonBiddingPartnership.id) nonBiddingPartnershipPoints++;
    if (joker && joker.winner === nonBiddingPartnership.id) nonBiddingPartnershipPoints++;
    if (game && game.winner === nonBiddingPartnership.id) nonBiddingPartnershipPoints++;

    const bidMade = biddingPartnershipPoints >= currentBid.amount;

    console.log(`🏆 Bidding partnership earned ${biddingPartnershipPoints} points (needed ${currentBid.amount})`);
    console.log(`🏆 Non-bidding partnership earned ${nonBiddingPartnershipPoints} points`);
    console.log(`🏆 Bid made: ${bidMade}`);

    return {
      points: { high, low, jack, offJack, joker, game },
      bidMade,
      biddingPartnership: biddingPartnership.id,
      nonBiddingPartnership: nonBiddingPartnership.id,
      biddingPartnershipPoints,
      nonBiddingPartnershipPoints,
    };
  }

  /**
   * Calculate small points (game points) for each partnership
   */
  private calculateGamePoints(tricks: Trick[]): { winner: string; smallPoints: number } | null {
    const partnershipPoints = new Map<string, number>();

    // Initialize partnership points
    this.gameState.partnerships.forEach((partnership) => {
      partnershipPoints.set(partnership.id, 0);
    });

    // Sum small points from all tricks
    tricks.forEach((trick) => {
      trick.cards.forEach((cardPlay) => {
        const card = cardPlay.card;
        const partnership = this.getPartnership(cardPlay.playerId);
        if (partnership) {
          const currentPoints = partnershipPoints.get(partnership.id) || 0;
          partnershipPoints.set(partnership.id, currentPoints + card.pointValue);
        }
      });
    });

    console.log("🏆 Small points by partnership:");
    partnershipPoints.forEach((points, partnershipId) => {
      console.log(`🏆   ${partnershipId}: ${points} points`);
    });

    // Find partnership with most small points
    let maxPoints = 0;
    let winningPartnership = "";

    partnershipPoints.forEach((points, partnershipId) => {
      if (points > maxPoints) {
        maxPoints = points;
        winningPartnership = partnershipId;
      } else if (points === maxPoints && maxPoints > 0) {
        // Tie-breaking: bidding partnership wins
        const currentBid = this.gameState.currentHand.currentBid;
        if (!currentBid) return { winner: winningPartnership, smallPoints: maxPoints };

        const biddingPlayer = this.gameState.players.find((p) => p.id === currentBid.playerId);
        if (!biddingPlayer) return { winner: winningPartnership, smallPoints: maxPoints };

        const biddingPartnership = this.getPartnership(biddingPlayer.id);
        if (!biddingPartnership) return { winner: winningPartnership, smallPoints: maxPoints };

        if (partnershipId === biddingPartnership.id) {
          winningPartnership = partnershipId;
        }
      }
    });

    if (maxPoints === 0) {
      console.log("🏆 No small points earned by any partnership");
      return null;
    }

    console.log(`🏆 Game point winner: ${winningPartnership} with ${maxPoints} small points`);
    return { winner: winningPartnership, smallPoints: maxPoints };
  }

  /**
   * Find the highest trump card taken in all tricks
   */
  private findHighestTrump(tricks: Trick[], trumpSuit: Suit): { winner: string; card: Card } | null {
    let highestTrump: { winner: string; card: Card } | null = null;

    tricks.forEach((trick) => {
      trick.cards.forEach((cardPlay) => {
        const card = cardPlay.card;

        if (card.isTrump(trumpSuit)) {
          if (!highestTrump || card.compareForTrump(highestTrump.card, trumpSuit) > 0) {
            const partnership = this.getPartnership(cardPlay.playerId);
            if (partnership) {
              highestTrump = { winner: partnership.id, card };
            }
          }
        }
      });
    });

    console.log("🏆 High trump search complete:", highestTrump ? "found" : "not found");

    return highestTrump;
  }

  /**
   * Find the lowest trump card taken in all tricks
   */
  private findLowestTrump(tricks: Trick[], trumpSuit: Suit): { winner: string; card: Card } | null {
    let lowestTrump: { winner: string; card: Card } | null = null;

    tricks.forEach((trick) => {
      trick.cards.forEach((cardPlay) => {
        const card = cardPlay.card;

        if (card.isTrump(trumpSuit)) {
          if (!lowestTrump || card.compareForTrump(lowestTrump.card, trumpSuit) < 0) {
            const partnership = this.getPartnership(cardPlay.playerId);
            if (partnership) {
              lowestTrump = { winner: partnership.id, card };
            }
          }
        }
      });
    });

    console.log("🏆 Low trump search complete:", lowestTrump ? "found" : "not found");

    return lowestTrump;
  }

  /**
   * Find the jack of trump if it was dealt and taken
   */
  private findJackOfTrump(tricks: Trick[], trumpSuit: Suit): { winner: string; card: Card } | null {
    for (const trick of tricks) {
      for (const cardPlay of trick.cards) {
        const card = cardPlay.card;

        if (!card.isJoker && card.suit === trumpSuit && card.rank === 11) {
          // Jack
          const partnership = this.getPartnership(cardPlay.playerId);
          if (partnership) {
            console.log(`🏆 Jack of trump: ${card.displayName} won by ${partnership.id}`);
            return { winner: partnership.id, card };
          }
        }
      }
    }

    console.log("🏆 Jack of trump: not found in tricks");
    return null;
  }

  /**
   * Find the off-jack (jack of same color as trump) if it was dealt and taken
   */
  private findOffJack(tricks: Trick[], trumpSuit: Suit): { winner: string; card: Card } | null {
    for (const trick of tricks) {
      for (const cardPlay of trick.cards) {
        const card = cardPlay.card;

        if (card.isOffJack(trumpSuit)) {
          const partnership = this.getPartnership(cardPlay.playerId);
          if (partnership) {
            console.log(`🏆 Off-jack: ${card.displayName} won by ${partnership.id}`);
            return { winner: partnership.id, card };
          }
        }
      }
    }

    console.log("🏆 Off-jack: not found in tricks");
    return null;
  }

  /**
   * Find the joker if it was dealt and taken
   */
  private findJoker(tricks: Trick[]): { winner: string; card: Card } | null {
    for (const trick of tricks) {
      for (const cardPlay of trick.cards) {
        const card = cardPlay.card;

        if (card.isJoker) {
          const partnership = this.getPartnership(cardPlay.playerId);
          if (partnership) {
            console.log(`🏆 Joker: ${card.displayName} won by ${partnership.id}`);
            return { winner: partnership.id, card };
          }
        }
      }
    }

    console.log("🏆 Joker: not found in tricks");
    return null;
  }

  /**
   * Update partnership scores based on hand scoring results
   */
  private updatePartnershipScores(scoreResult: HandScoreResult): void {
    const biddingPartnership = this.gameState.partnerships.find((p) => p.id === scoreResult.biddingPartnership);
    const nonBiddingPartnership = this.gameState.partnerships.find((p) => p.id === scoreResult.nonBiddingPartnership);
    const currentBid = this.gameState.currentHand.currentBid;

    if (!biddingPartnership) throw new Error("Bidding partnership not found for scoring");
    if (!nonBiddingPartnership) throw new Error("Non-bidding partnership not found for scoring");
    if (!currentBid) throw new Error("Current bid not found for scoring");

    console.log("🏆 Updating partnership scores...");
    console.log(
      `🏆 Before - ${biddingPartnership.id}: ${biddingPartnership.score}, ${nonBiddingPartnership.id}: ${nonBiddingPartnership.score}`
    );

    // Bidding partnership: gets bid amount if made, loses bid amount if failed
    if (scoreResult.bidMade) {
      biddingPartnership.score += currentBid.amount;
      console.log(`🏆 Bidding partnership made bid - added ${currentBid.amount} points`);
    } else {
      biddingPartnership.score -= currentBid.amount;
      console.log(`🏆 Bidding partnership failed bid - subtracted ${currentBid.amount} points`);
    }

    // Non-bidding partnership always gets actual points earned
    nonBiddingPartnership.score += scoreResult.nonBiddingPartnershipPoints;
    console.log(`🏆 Non-bidding partnership earned ${scoreResult.nonBiddingPartnershipPoints} points`);

    console.log(
      `🏆 After - ${biddingPartnership.id}: ${biddingPartnership.score}, ${nonBiddingPartnership.id}: ${nonBiddingPartnership.score}`
    );
  }

  /**
   * Prepare for the next hand
   */
  private prepareNextHand(): void {
    // Rotate dealer clockwise
    this.rotateDealer();

    // Reset hand state
    this.gameState.currentHand = {
      trumpSuit: null,
      currentBid: null,
      biddingPhase: false,
      currentPlayerIndex: 0,
      tricks: [],
      currentTrick: null,
      bids: [],
    };

    // Deal new hand
    this.gameState.gamePhase = GamePhase.DEALING;
    this.dealHand();

    this.emit("nextHandStarted", this.gameState);
  }

  /**
   * Rotate dealer clockwise to next player
   */
  private rotateDealer(): void {
    const currentDealerIndex = this.gameState.players.findIndex((p) => p.isDealer);
    const nextDealerIndex = (currentDealerIndex + 1) % 4;

    // Update dealer flags
    this.gameState.players[currentDealerIndex].isDealer = false;
    this.gameState.players[nextDealerIndex].isDealer = true;

    this.emit("dealerRotated", this.gameState.players[nextDealerIndex]);
  }

  /**
   * Check if game should end (any partnership has 21+ points)
   */
  private checkGameEnd(): boolean {
    const winningPartnership = this.gameState.partnerships.find((p) => p.score >= this.config.targetScore);
    if (winningPartnership) {
      this.gameState.winner = winningPartnership;
      return true;
    }
    return false;
  }

  /**
   * Check if game is over
   */
  isGameOver(): boolean {
    return this.gameState.partnerships.some((p) => p.score >= this.config.targetScore);
  }
}
