import { EventEmitter } from "events";
import { Card } from "@/entities/Card";
import { Deck } from "@/entities/Deck";
import {
  Bid,
  GameConfig,
  GamePhase,
  GameState,
  Partnership,
  Player,
  PlayerPosition,
  Suit,
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
    const positions = [
      PlayerPosition.SOUTH,
      PlayerPosition.WEST,
      PlayerPosition.NORTH,
      PlayerPosition.EAST,
    ];

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
    return [
      {
        id: "ns_partnership",
        player1Id: players.find((p) => p.position === PlayerPosition.NORTH)!.id,
        player2Id: players.find((p) => p.position === PlayerPosition.SOUTH)!.id,
        score: 0,
      },
      {
        id: "ew_partnership",
        player1Id: players.find((p) => p.position === PlayerPosition.EAST)!.id,
        player2Id: players.find((p) => p.position === PlayerPosition.WEST)!.id,
        score: 0,
      },
    ];
  }

  /**
   * Start a new game
   */
  startGame(): void {
    this.gameState.gamePhase = GamePhase.DEALING;
    this.dealHand();
    this.emit("gameStarted", this.gameState);
  }

  /**
   * Deal 6 cards to each player
   */
  private dealHand(): void {
    this.deck.reset();

    // Clear all hands
    this.gameState.players.forEach((player) => (player.hand = []));

    // Deal 6 cards to each player
    for (let i = 0; i < 6; i++) {
      this.gameState.players.forEach((player) => {
        const card = this.deck.dealCard();
        if (card) {
          player.hand.push(card);
        }
      });
    }

    // Sort hands
    this.gameState.players.forEach((player) => {
      this.sortHand(player.hand);
    });

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
    this.gameState.gamePhase = GamePhase.BIDDING;
    this.gameState.currentHand.biddingPhase = true;
    this.gameState.currentHand.currentBid = null;

    // Bidding starts with player to the left of dealer
    const dealerIndex = this.gameState.players.findIndex((p) => p.isDealer);
    this.gameState.currentHand.currentPlayerIndex = (dealerIndex + 1) % 4;

    this.emit("biddingStarted", this.gameState);
  }

  /**
   * Process a bid from a player
   */
  placeBid(playerId: string, bidAmount: number | null): boolean {
    if (this.gameState.gamePhase !== GamePhase.BIDDING) {
      return false;
    }

    const player =
      this.gameState.players[this.gameState.currentHand.currentPlayerIndex];
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
      const currentBid = this.gameState.currentHand.currentBid;
      if (bidAmount! < 2 || bidAmount! > 6) {
        return false; // Invalid bid amount
      }
      if (currentBid && bidAmount! <= currentBid.amount) {
        return false; // Bid too low
      }
    }

    // Accept the bid
    if (!bid.passed) {
      this.gameState.currentHand.currentBid = bid;
    }

    // Move to next player
    this.gameState.currentHand.currentPlayerIndex =
      (this.gameState.currentHand.currentPlayerIndex + 1) % 4;

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

    // For now, simplified: bidding ends after one round
    // TODO: Implement proper bidding logic with pass tracking
    return true;
  }

  /**
   * End bidding and start playing
   */
  private endBidding(): void {
    let finalBid = this.gameState.currentHand.currentBid;

    // If no bid was made, dealer gets stuck with 2
    if (!finalBid) {
      const dealer = this.gameState.players.find((p) => p.isDealer)!;
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
    const bidWinner = this.gameState.players.find(
      (p) => p.id === finalBid.playerId
    )!;
    this.gameState.currentHand.currentPlayerIndex =
      this.gameState.players.indexOf(bidWinner);

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
    return this.gameState.partnerships.find(
      (p) => p.player1Id === playerId || p.player2Id === playerId
    );
  }

  /**
   * Check if game is over
   */
  isGameOver(): boolean {
    return this.gameState.partnerships.some(
      (p) => p.score >= this.config.targetScore
    );
  }
}
