import { Scene } from "phaser";
import { BiddingAI } from "@/ai/BiddingAI";
import { CardSprite } from "@/components/CardSprite";
import { CardTooltip } from "@/components/CardTooltip";
import { TurnIndicator } from "@/components/TurnIndicator";
import { CardThemeManager } from "@/managers/CardThemeManager";
import { GameManager } from "@/managers/GameManager";
import { KeyboardManager } from "@/managers/KeyboardManager";
import { AIPersonality, type Bid, type Player, type GameConfig as SetbackGameConfig } from "@/types/game";
import type { CardSelectionState } from "@/types/interaction";
import {
  getCardDisplayState,
  getErrorDisplayMessage,
  getInteractionError,
  requiresConfirmation,
  validateCardPlay,
} from "@/utils/InteractionUtils";
import { getResponsiveFontSizePx, getResponsiveSpacing } from "@/utils/ResponsiveUtils";

interface SceneData {
  players: Array<{
    name: string;
    isHuman: boolean;
  }>;
}

export class GameScene extends Scene {
  private gameManager!: GameManager;
  private themeManager!: CardThemeManager;
  private keyboardManager!: KeyboardManager;
  private turnIndicator!: TurnIndicator;
  private biddingAI!: BiddingAI;
  private playerTexts: { [playerId: string]: Phaser.GameObjects.Text } = {};
  private playerLeaderBorders: {
    [playerId: string]: Phaser.GameObjects.Graphics;
  } = {};
  private playerDealerBorders: {
    [playerId: string]: Phaser.GameObjects.Graphics;
  } = {};
  private scoreTexts: { [partnershipId: string]: Phaser.GameObjects.Text } = {};
  private statusText!: Phaser.GameObjects.Text;
  private handContainer!: Phaser.GameObjects.Container;
  private cardSprites: CardSprite[] = [];
  private trumpDisplay!: Phaser.GameObjects.Text;
  private trickInfo!: Phaser.GameObjects.Text;
  private biddingDisplay!: Phaser.GameObjects.Container;
  private playerBidTexts: { [playerId: string]: Phaser.GameObjects.Text } = {};
  private currentBidDisplay!: Phaser.GameObjects.Text;
  private persistentBidDisplay!: Phaser.GameObjects.Text;
  private lastTrickWinnerDisplay!: Phaser.GameObjects.Text;
  private trickArea!: Phaser.GameObjects.Container;
  private playedCardSprites: { [playerId: string]: CardSprite } = {};
  private isHandCompleting: boolean = false;
  private completedHandData: {
    tricksPlayed: number;
    trumpSuit: string;
  } | null = null;
  private handCompleteTimers: Phaser.Time.TimerEvent[] = [];

  // Enhanced interaction state
  private selectionState: CardSelectionState = {
    selectedCard: null,
    confirmationRequired: true,
    selectionTime: 0,
  };
  private confirmButton!: Phaser.GameObjects.Text;
  private cancelButton!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "GameScene" });
  }

  init(data: SceneData): void {
    const gameConfig: SetbackGameConfig = {
      targetScore: 21,
      players: data.players,
    };

    this.gameManager = new GameManager(gameConfig);
    this.themeManager = new CardThemeManager();
    this.keyboardManager = new KeyboardManager(this);
    this.biddingAI = new BiddingAI();
    this.setupGameEvents();
    this.setupInteractionEvents();
  }

  create(): void {
    console.log("🎮 GameScene created");
    this.createUI();
    this.createInteractionUI();
    console.log("🎮 Starting game...");
    this.gameManager.startGame();
  }

  private setupGameEvents(): void {
    this.gameManager.on("gameStarted", this.onGameStarted.bind(this));
    this.gameManager.on("biddingStarted", this.onBiddingStarted.bind(this));
    this.gameManager.on("bidPlaced", this.onBidPlaced.bind(this));
    this.gameManager.on("biddingEnded", this.onBiddingEnded.bind(this));
    this.gameManager.on("playStarted", this.onPlayStarted.bind(this));
    this.gameManager.on("cardPlayed", this.onCardPlayed.bind(this));
    this.gameManager.on("trumpEstablished", this.onTrumpEstablished.bind(this));
    this.gameManager.on("invalidPlay", this.onInvalidPlay.bind(this));
    this.gameManager.on("trickComplete", this.onTrickComplete.bind(this));
    this.gameManager.on("handCompleted", this.onHandComplete.bind(this));
    this.gameManager.on("handScored", this.onHandScored.bind(this));
    this.gameManager.on("nextHandStarted", this.onNextHandStarted.bind(this));
    this.gameManager.on("deckReshuffled", this.onDeckReshuffled.bind(this));
    this.gameManager.on("gameEnded", this.onGameEnded.bind(this));
  }

  private createUI(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.tileSprite(0, 0, width, height, "table-felt").setOrigin(0);

    // Create player areas
    this.createPlayerAreas();

    // Create score display
    this.createScoreDisplay();

    // Create status display
    this.statusText = this.add
      .text(width / 2, 50, "Starting Game...", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#333333",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5);

    // Create hand area for human player
    this.createHandArea();

    // Back to menu button
    const menuButton = this.add
      .text(50, 50, "MENU", {
        fontSize: getResponsiveFontSizePx(16),
        color: "#ffffff",
        backgroundColor: "#666666",
        padding: { x: 15, y: 8 },
      })
      .setOrigin(0.5);

    menuButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      this.scene.start("MenuScene");
    });

    // Theme switching UI removed for cleaner interface

    // Create game info displays
    this.createGameInfoDisplays();
  }

  /**
   * Setup enhanced interaction events
   */
  private setupInteractionEvents(): void {
    // Keyboard manager events
    this.keyboardManager.on("cardSelected", this.onKeyboardCardSelected.bind(this));
    this.keyboardManager.on("cardConfirmed", this.onKeyboardCardConfirmed.bind(this));
    this.keyboardManager.on("cardCancelled", this.onKeyboardCardCancelled.bind(this));
    this.keyboardManager.on("announcement", this.onAccessibilityAnnouncement.bind(this));

    // Enhanced game manager events for interaction feedback
    this.gameManager.on("cardPlayabilityChanged", this.onCardPlayabilityChanged.bind(this));
    this.gameManager.on("currentPlayerChanged", this.onCurrentPlayerChanged.bind(this));
  }

  /**
   * Create enhanced interaction UI elements
   */
  private createInteractionUI(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create turn indicator
    this.turnIndicator = new TurnIndicator(this, width / 2, 200);

    // Create confirm/cancel buttons (initially hidden) - enhanced for mobile touch
    const buttonSpacing = getResponsiveSpacing(80);
    const buttonY = height - getResponsiveSpacing(150);

    this.confirmButton = this.add
      .text(width / 2 - buttonSpacing, buttonY, "CONFIRM PLAY", {
        fontSize: getResponsiveFontSizePx(16),
        color: "#ffffff",
        backgroundColor: "#4CAF50",
        padding: { x: getResponsiveSpacing(20), y: getResponsiveSpacing(10) },
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.confirmCardPlay());

    this.cancelButton = this.add
      .text(width / 2 + buttonSpacing, buttonY, "CANCEL", {
        fontSize: getResponsiveFontSizePx(16),
        color: "#ffffff",
        backgroundColor: "#f44336",
        padding: { x: getResponsiveSpacing(20), y: getResponsiveSpacing(10) },
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.cancelCardSelection());
  }

  private createPlayerAreas(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const gameState = this.gameManager.getGameState();

    gameState.players.forEach((player: Player) => {
      let x: number, y: number;

      switch (player.position) {
        case "south": // Human player (bottom)
          x = width / 2;
          y = height - 100;
          break;
        case "north": // Top
          x = width / 2;
          y = 100;
          break;
        case "east": // Right
          x = width - 150;
          y = height / 2;
          break;
        case "west": // Left
          x = 150;
          y = height / 2;
          break;
        default:
          x = 0;
          y = 0;
      }

      const dealerIndicator = player.isDealer ? " 🃏" : "";
      const playerText = this.add
        .text(x, y, `${player.name}${dealerIndicator}`, {
          fontSize: getResponsiveFontSizePx(18),
          color: "#ffffff",
          backgroundColor: player.isDealer ? "#6a4c93" : "#444444",
          padding: { x: 15, y: 8 },
        })
        .setOrigin(0.5);

      this.playerTexts[player.id] = playerText;

      // Create leader border graphics for this player
      this.createPlayerLeaderBorder(player.id, x, y, playerText);

      // Create dealer border graphics for this player
      this.createPlayerDealerBorder(player.id, x, y, playerText, player.isDealer);
    });
  }

  /**
   * Create leader border graphics for a player
   */
  private createPlayerLeaderBorder(playerId: string, x: number, y: number, playerText: Phaser.GameObjects.Text): void {
    const graphics = this.add.graphics();

    // Calculate border dimensions based on text size
    const textBounds = playerText.getBounds();
    const borderWidth = textBounds.width + 12; // Add padding
    const borderHeight = textBounds.height + 8; // Add padding

    // Create thick dark black border
    graphics.lineStyle(4, 0x000000, 1.0); // 4px thick black border
    graphics.strokeRect(x - borderWidth / 2, y - borderHeight / 2, borderWidth, borderHeight);

    // Initially hide the border
    graphics.setVisible(false);

    // Store reference
    this.playerLeaderBorders[playerId] = graphics;
  }

  /**
   * Create dealer border graphics for a player
   */
  private createPlayerDealerBorder(
    playerId: string,
    x: number,
    y: number,
    playerText: Phaser.GameObjects.Text,
    isDealer: boolean
  ): void {
    const graphics = this.add.graphics();

    // Calculate border dimensions based on text size
    const textBounds = playerText.getBounds();
    const borderWidth = textBounds.width + 16; // More padding than leader border
    const borderHeight = textBounds.height + 12; // More padding than leader border

    // Create thick golden/yellow border for dealer (distinct from black leader border)
    graphics.lineStyle(3, 0xffd700, 1.0); // 3px thick gold border
    graphics.strokeRect(x - borderWidth / 2, y - borderHeight / 2, borderWidth, borderHeight);

    // Show border only if player is dealer
    graphics.setVisible(isDealer);

    // Store reference
    this.playerDealerBorders[playerId] = graphics;
  }

  /**
   * Show leader border for a specific player
   */
  private showPlayerLeaderBorder(playerId: string): void {
    const border = this.playerLeaderBorders[playerId];
    if (border) {
      border.setVisible(true);
    }
  }

  /**
   * Hide all leader borders
   */
  private hideAllLeaderBorders(): void {
    Object.values(this.playerLeaderBorders).forEach((border) => {
      if (border) {
        border.setVisible(false);
      }
    });
  }

  /**
   * Show dealer border for a specific player
   */
  private showPlayerDealerBorder(playerId: string): void {
    const border = this.playerDealerBorders[playerId];
    if (border) {
      border.setVisible(true);
    }
  }

  /**
   * Hide all dealer borders
   */
  private hideAllDealerBorders(): void {
    Object.values(this.playerDealerBorders).forEach((border) => {
      if (border) {
        border.setVisible(false);
      }
    });
  }

  /**
   * Update dealer borders based on current game state
   */
  private updateDealerBorders(): void {
    const gameState = this.gameManager.getGameState();

    // Hide all dealer borders first
    this.hideAllDealerBorders();

    // Show border for current dealer
    gameState.players.forEach((player) => {
      if (player.isDealer) {
        this.showPlayerDealerBorder(player.id);
      }
    });
  }

  /**
   * Update last trick winner display
   */
  private updateLastTrickWinnerDisplay(winner: any): void {
    if (winner) {
      this.lastTrickWinnerDisplay.setText(`Last Trick: ${winner.name}`);
      this.lastTrickWinnerDisplay.setVisible(true);
      console.log(`🏆 Last trick winner display updated: ${winner.name}`);
    } else {
      this.lastTrickWinnerDisplay.setText("Last Trick: None");
      this.lastTrickWinnerDisplay.setVisible(false);
    }
  }

  private createScoreDisplay(): void {
    const width = this.cameras.main.width;
    const gameState = this.gameManager.getGameState();

    // North/South partnership score (left side)
    const nsPartnership = gameState.partnerships[0];
    this.scoreTexts[nsPartnership.id] = this.add
      .text(100, 150, `N/S: ${nsPartnership.score}`, {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#2a5a3a",
        padding: { x: 15, y: 10 },
      })
      .setOrigin(0.5);

    // East/West partnership score (right side)
    const ewPartnership = gameState.partnerships[1];
    this.scoreTexts[ewPartnership.id] = this.add
      .text(width - 100, 150, `E/W: ${ewPartnership.score}`, {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#2a5a3a",
        padding: { x: 15, y: 10 },
      })
      .setOrigin(0.5);
  }

  private createHandArea(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.handContainer = this.add.container(width / 2, height - 80);
  }

  private updateHand(): void {
    // Clear existing cards and tooltips
    this.cardSprites.forEach((sprite) => {
      sprite.hideTooltip();
      sprite.destroy();
    });
    this.cardSprites = [];

    const gameState = this.gameManager.getGameState();
    const humanPlayer = gameState.players.find((p) => p.isHuman);

    if (!humanPlayer) return;

    console.log(`🎯 UPDATE HAND: Human player has ${humanPlayer.hand.length} cards`);
    console.log(
      `🎯 Hand cards:`,
      humanPlayer.hand.map((c) => c.displayName)
    );
    console.log(`🎯 Game phase: ${gameState.gamePhase}`);
    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];
    console.log(`🎯 Current player: ${currentPlayer.name} (isHuman: ${currentPlayer.isHuman})`);

    // Display human player's hand using CardSprite
    const cardSpacing = 100;
    const startX = (-(humanPlayer.hand.length - 1) * cardSpacing) / 2;
    const currentTheme = this.themeManager.getCurrentTheme();

    humanPlayer.hand.forEach((card, index) => {
      const x = startX + index * cardSpacing;

      // Create enhanced CardSprite with interaction features
      const cardSprite = new CardSprite(this, x, 0, card, currentTheme);

      // Get comprehensive display state
      // Only validate playability if it's actually the human's turn
      const isHumanTurn = currentPlayer.id === humanPlayer.id;
      const displayState = isHumanTurn
        ? getCardDisplayState(card, humanPlayer, gameState, this.selectionState.selectedCard?.id === card.id)
        : {
            playable: false,
            selected: this.selectionState.selectedCard?.id === card.id,
            highlighted: false,
            dimmed: true,
            reason: `${currentPlayer.name} is playing - wait for your turn`,
          };

      // Apply display state
      cardSprite.setDisplayState(displayState);

      // Set up enhanced event handlers
      this.setupCardEventHandlers(cardSprite, card);

      this.cardSprites.push(cardSprite);
      this.handContainer.add(cardSprite);
    });

    // Update keyboard manager with new cards
    const selectableCards = this.cardSprites.filter((sprite) => sprite.getDisplayState().playable);
    this.keyboardManager.updateSelectableCards(selectableCards);
  }

  /**
   * Setup comprehensive event handlers for a card sprite
   */
  private setupCardEventHandlers(cardSprite: CardSprite, card: any): void {
    // Enhanced selection events
    cardSprite.on("cardSelected", (event: any) => {
      this.onEnhancedCardSelected(card, event);
    });

    cardSprite.on("cardConfirmed", (event: any) => {
      this.onEnhancedCardConfirmed(card, event);
    });

    cardSprite.on("cardCancelled", (event: any) => {
      this.onEnhancedCardCancelled(card, event);
    });

    // Hover events for enhanced feedback
    cardSprite.on("cardHoverStart", (event: any) => {
      this.onCardHoverStart(card, event);
    });

    cardSprite.on("cardHoverEnd", (event: any) => {
      this.onCardHoverEnd(card, event);
    });

    // Mobile long press events
    cardSprite.on("cardLongPress", (event: any) => {
      this.onCardLongPress(card, event);
    });

    // Tooltip requests with fresh game state
    cardSprite.on("tooltipRequested", (event: any) => {
      this.onTooltipRequested(card, event);
    });
  }

  private onGameStarted(): void {
    console.log("🎮 Game started event received");
    this.statusText.setText("Game Started - Dealing Cards...");
    this.updateHand();
    this.updateScores();

    // Show dealer border
    this.updateDealerBorders();

    // Clear last trick winner for new game
    this.updateLastTrickWinnerDisplay(null);
  }

  private onBiddingStarted(): void {
    console.log("🎯 BIDDING STARTED EVENT RECEIVED!");
    this.statusText.setText("🎯 Bidding Phase Started!");
    this.highlightCurrentPlayer();

    // Update turn indicator and show bidding displays
    const gameState = this.gameManager.getGameState();
    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];
    const instruction = currentPlayer.isHuman ? "Your turn to bid" : `${currentPlayer.name} is bidding...`;
    this.turnIndicator.showPlayerTurn(currentPlayer, instruction);

    // Show the bidding displays
    this.biddingDisplay.setVisible(true);
    this.persistentBidDisplay.setVisible(true);
    this.updateBiddingDisplay();
    this.updatePersistentBidDisplay();

    console.log("🎯 Current player:", currentPlayer.name, "isHuman:", currentPlayer.isHuman);
    console.log(
      "🎯 All players:",
      gameState.players.map((p) => `${p.name}(${p.isHuman ? "Human" : "AI"})`)
    );

    if (currentPlayer.isHuman) {
      console.log("🎯 SHOWING BIDDING UI FOR HUMAN!");

      // Check if only PASS is available (no valid bids left)
      const currentBid = gameState.currentHand.currentBid;
      const minBid = currentBid ? currentBid.amount + 1 : 2;

      if (minBid > 6) {
        // Only PASS available - auto-pass and show message
        console.log("🎯 Only PASS available at bidding start - auto-passing for user");
        this.statusText.setText("🎯 Bidding maxed out - automatically passing");
        this.time.delayedCall(1500, () => {
          this.gameManager.placeBid(currentPlayer.id, null);
        });
      } else {
        // Normal bidding UI with choices
        this.statusText.setText("🎯 Your turn to bid!");
        this.showBiddingUI();
      }
    } else {
      console.log("🎯 AI player will bid automatically");
      this.statusText.setText(`🎯 ${currentPlayer.name} is bidding...`);
      // AI player bids automatically after a delay
      this.time.delayedCall(1500, () => {
        this.makeAIBid();
      });
    }
  }

  private onBidPlaced(bid: Bid): void {
    const player = this.gameManager.getPlayer(bid.playerId);
    if (bid.passed) {
      this.statusText.setText(`${player?.name} passed`);
    } else {
      this.statusText.setText(`${player?.name} bid ${bid.amount}`);
    }

    // Update the bidding displays
    this.updateBiddingDisplay();
    this.updatePersistentBidDisplay();
    this.highlightCurrentPlayer();

    // Check if next player is human
    const gameState = this.gameManager.getGameState();
    if (gameState.gamePhase === "bidding") {
      const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];
      console.log("🎯 After bid, current player:", currentPlayer.name, "isHuman:", currentPlayer.isHuman);

      // CRITICAL: Update turn indicator after each bid
      console.log(`🎯 BIDDING TURN: ${currentPlayer.name} to bid (isHuman: ${currentPlayer.isHuman})`);
      this.updateTurnIndicator();

      if (currentPlayer.isHuman) {
        console.log("🎯 SHOWING BIDDING UI AFTER AI BID!");

        // Check if only PASS is available (no valid bids left)
        const currentBid = gameState.currentHand.currentBid;
        const minBid = currentBid ? currentBid.amount + 1 : 2;

        if (minBid > 6) {
          // Only PASS available - auto-pass and show message
          console.log("🎯 Only PASS available - auto-passing for user");
          this.statusText.setText("🎯 Bidding maxed out - automatically passing");
          this.time.delayedCall(1500, () => {
            this.gameManager.placeBid(currentPlayer.id, null);
          });
        } else {
          // Normal bidding UI with choices
          this.statusText.setText("🎯 Your turn to bid!");
          this.showBiddingUI();
        }
      } else {
        // AI player bids automatically after a delay
        this.time.delayedCall(1000, () => {
          this.makeAIBid();
        });
      }
    }
  }

  private onBiddingEnded(finalBid: Bid): void {
    const player = this.gameManager.getPlayer(finalBid.playerId);
    this.statusText.setText(`${player?.name} won bid with ${finalBid.amount} points`);

    // Hide bidding display after a short delay
    this.time.delayedCall(2000, () => {
      this.biddingDisplay.setVisible(false);
    });
  }

  private onPlayStarted(): void {
    this.statusText.setText("Play Phase - Playing cards...");
    this.highlightCurrentPlayer();

    // Update turn indicator for play phase
    const gameState = this.gameManager.getGameState();
    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];
    const instruction = currentPlayer.isHuman ? "Your turn to play a card" : `${currentPlayer.name} is playing...`;
    this.turnIndicator.showPlayerTurn(currentPlayer, instruction);

    // Show trick area and hide bidding display
    this.biddingDisplay.setVisible(false);
    this.trickArea.setVisible(true);
    this.updateGameInfo();

    // Check if current player is AI and start their turn

    if (!currentPlayer.isHuman) {
      console.log("🎮 AI player should play first card:", currentPlayer.name);
      this.statusText.setText(`${currentPlayer.name} is playing...`);
      this.time.delayedCall(1500, () => {
        this.makeAIPlay();
      });
    } else {
      this.statusText.setText("Your turn to play a card");
    }
  }

  private onCardPlayed(event: any): void {
    const player = this.gameManager.getPlayer(event.playerId);
    this.statusText.setText(`${player?.name} played ${event.card.displayName}`);

    // Add the played card to the trick area
    this.addCardToTrick(player, event.card);
    this.updateGameInfo();

    // Check if this is the 4th card of the trick
    const gameState = this.gameManager.getGameState();
    const currentTrick = gameState.currentHand.currentTrick;

    if (currentTrick && currentTrick.cards.length < 4) {
      // Not the final card, highlight next player normally
      this.highlightCurrentPlayer();
    } else {
      // This is the 4th card - let the trick complete event handle highlighting
      console.log("🎯 4th card played, waiting for trick completion");
    }
  }

  private onTrumpEstablished(trumpSuit: any): void {
    this.statusText.setText(`Trump suit established: ${trumpSuit.toUpperCase()}`);
  }

  private onInvalidPlay(event: any): void {
    const player = this.gameManager.getPlayer(event.playerId);
    this.statusText.setText(`${player?.name}: ${event.reason}`);
  }

  private onTrickComplete(trick: any): void {
    const winner = this.gameManager.getPlayer(trick.winner);
    console.log(`🎯 TRICK COMPLETE: ${winner?.name} wins! Trick has ${trick.cards.length} cards`);
    console.log(`🎯 Current playedCardSprites count:`, Object.keys(this.playedCardSprites).length);

    this.statusText.setText(`${winner?.name} wins the trick!`);

    // Update last trick winner display
    this.updateLastTrickWinnerDisplay(winner);

    // Highlight the trick winner
    this.highlightTrickWinner(winner);

    // Clear the trick after a brief display, then continue immediately
    // This prevents the race condition with new trick starting
    console.log("🎯 Clearing trick after brief display to prevent UI desync");
    this.time.delayedCall(800, () => {
      this.clearTrick();
      console.log("🎯 Trick cleared, continuing game");

      // Only continue if this isn't the final trick AND we're still in playing phase
      const gameState = this.gameManager.getGameState();
      const shouldContinue = !this.isHandCompleting && gameState.gamePhase === "playing";

      console.log("🎯 Should continue after trick?", shouldContinue);
      console.log("🎯   isHandCompleting:", this.isHandCompleting);
      console.log("🎯   gamePhase:", gameState.gamePhase);

      if (shouldContinue) {
        this.continueAfterTrick();
      } else {
        console.log("🎯 Skipping continueAfterTrick - wrong phase or hand completing");
      }
    });
  }

  private onHandComplete(_completedHand: any): void {
    // Set flag to indicate hand is completing
    this.isHandCompleting = true;

    console.log("🏁 Hand complete event received");

    // Capture the completed hand data before it gets reset
    const gameState = this.gameManager.getGameState();
    this.completedHandData = {
      tricksPlayed: gameState.currentHand.tricks.length,
      trumpSuit: gameState.currentHand.trumpSuit || "undefined",
    };

    console.log("🏁 Captured completed hand data:", this.completedHandData);

    // Let the final trick display for full duration, then handle hand completion
    const timer1 = this.time.delayedCall(2500, () => {
      this.statusText.setText("Hand complete - calculating scores...");

      // Show hand completion UI after additional delay
      const timer2 = this.time.delayedCall(3000, () => {
        this.showHandCompleteUI();
        this.isHandCompleting = false;
      });
      this.handCompleteTimers.push(timer2);
    });
    this.handCompleteTimers.push(timer1);
  }

  private onHandScored(scoreResult: any): void {
    console.log("🏆 Hand scored event received:", scoreResult);

    // Update the partnership scores display
    this.updateScores();

    // Show scoring information
    const bidMadeText = scoreResult.bidMade ? "made" : "failed";
    this.statusText.setText(`Hand scored - Bid ${bidMadeText}! Updating scores...`);

    // Log detailed scoring breakdown
    console.log("🏆 Scoring breakdown:");
    console.log(
      `🏆   Bidding partnership (${scoreResult.biddingPartnership}): ${scoreResult.biddingPartnershipPoints} points`
    );
    console.log(
      `🏆   Non-bidding partnership (${scoreResult.nonBiddingPartnership}): ${scoreResult.nonBiddingPartnershipPoints} points`
    );
    console.log(`🏆   Bid ${bidMadeText}`);

    // Show detailed point breakdown
    const points = scoreResult.points;
    if (points.high) console.log(`🏆   High trump: ${points.high.winner}`);
    if (points.low) console.log(`🏆   Low trump: ${points.low.winner}`);
    if (points.jack) console.log(`🏆   Jack of trump: ${points.jack.winner}`);
    if (points.offJack) console.log(`🏆   Off-jack: ${points.offJack.winner}`);
    if (points.joker) console.log(`🏆   Joker: ${points.joker.winner}`);
    if (points.game) console.log(`🏆   Game points: ${points.game.winner} (${points.game.smallPoints} small points)`);
  }

  private onNextHandStarted(_gameState: any): void {
    console.log("🔄 Next hand started event received");
    this.isHandCompleting = false;

    // Update dealer borders for new hand (dealer may have rotated)
    this.updateDealerBorders();

    // Clear last trick winner for new hand
    this.updateLastTrickWinnerDisplay(null);

    // Cancel any pending hand complete timers specifically
    this.handCompleteTimers.forEach((timer) => {
      if (timer && !timer.hasDispatched) {
        timer.remove();
        console.log("🔄 Cancelled pending hand complete timer");
      }
    });
    this.handCompleteTimers = [];

    // Cancel any pending trick continuation timers to prevent race conditions
    this.time.removeAllEvents();

    // Clear any existing UI elements from previous hand
    this.clearTrick();

    // Update the display with new hand state
    this.updateHand();
    this.updateGameInfo();

    // Reset status
    this.statusText.setText("New hand starting - bidding will begin...");
  }

  private onDeckReshuffled(_data: any): void {
    console.log("🔀 Deck reshuffled event received");

    // Show reshuffle notification to players
    this.statusText.setText("🔀 Deck reshuffled - not enough cards remaining");

    // Brief pause to let players see the reshuffle message
    this.time.delayedCall(2000, () => {
      this.statusText.setText("New hand starting - bidding will begin...");
    });
  }

  private onGameEnded(gameEndData: any): void {
    console.log("🏆 Game ended event received:", gameEndData);

    const { winner, finalScores, targetScore } = gameEndData;

    // Update status to show game completion
    this.statusText.setText(`🏆 Game Over! ${winner.id} wins with ${winner.score} points!`);

    // Log detailed game completion info
    console.log(`🏆 Game winner: ${winner.id} with ${winner.score}/${targetScore} points`);
    console.log("🏆 Final scores:");
    finalScores.forEach((partnership: any) => {
      console.log(`🏆   ${partnership.id}: ${partnership.score} points`);
    });

    // Hide any active game UI elements
    this.biddingDisplay.setVisible(false);
    this.trickArea.setVisible(false);

    // Show game over UI after a brief delay
    this.time.delayedCall(2000, () => {
      this.showGameOverUI(winner, finalScores, targetScore);
    });
  }

  private continueAfterTrick(): void {
    const gameState = this.gameManager.getGameState();
    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];

    console.log("🎯 CONTINUE AFTER TRICK - current player:", currentPlayer.name);
    console.log("🎯 Current player index:", gameState.currentHand.currentPlayerIndex);
    console.log("🎯 Current player ID:", currentPlayer.id);
    console.log("🎯 Current player isHuman:", currentPlayer.isHuman);
    console.log("🎯 Current player hand size:", currentPlayer.hand.length);

    // Check if we're still in playing phase and there are more tricks to play
    if (gameState.gamePhase === "playing") {
      // Check if hand is complete (all players should have same number of cards)
      const totalCardsRemaining = gameState.players.reduce((sum, player) => sum + player.hand.length, 0);
      console.log("🎯 Total cards remaining across all players:", totalCardsRemaining);
      console.log(
        "🎯 Cards per player:",
        gameState.players.map((p) => `${p.name}: ${p.hand.length}`)
      );

      // CRITICAL CHECK: If current player has no cards, something is wrong
      if (currentPlayer.hand.length === 0) {
        console.error("🚨 CRITICAL BUG: Current player has no cards but game continues!");
        this.statusText.setText("⚠️ Game error: Player has no cards");
        return;
      }

      if (totalCardsRemaining > 0) {
        // Start next trick
        this.statusText.setText(`${currentPlayer.name} leads the next trick`);
        this.highlightCurrentPlayer();

        // CRITICAL: Update turn indicator for new trick leader
        console.log(`🎯 NEW TRICK: ${currentPlayer.name} leads (isHuman: ${currentPlayer.isHuman})`);
        this.updateTurnIndicator();

        // CRITICAL: Update card states for new trick leader
        this.updateCardSelectionStates();

        if (!currentPlayer.isHuman) {
          // AI leads next trick
          this.time.delayedCall(1500, () => {
            this.makeAIPlay();
          });
        } else {
          // Human leads next trick
          this.statusText.setText("Your turn to lead the next trick");
        }
      } else {
        // Hand completion is now handled by onHandComplete event
        console.log("🎯 Hand complete detected in continueAfterTrick - should be handled by onHandComplete");
      }
    }
  }

  private highlightCurrentPlayer(): void {
    const gameState = this.gameManager.getGameState();
    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];

    // Reset all player text styles
    Object.values(this.playerTexts).forEach((text) => {
      text.setStyle({ backgroundColor: "#444444" });
    });

    // Highlight current player
    if (this.playerTexts[currentPlayer.id]) {
      this.playerTexts[currentPlayer.id].setStyle({
        backgroundColor: "#6a4c93",
      });
    }
  }

  private highlightTrickWinner(winner: any): void {
    // Reset all player text styles
    Object.values(this.playerTexts).forEach((text) => {
      text.setStyle({ backgroundColor: "#444444" });
    });

    // Hide all leader borders first
    this.hideAllLeaderBorders();

    // Highlight trick winner with special color and leader border
    if (winner && this.playerTexts[winner.id]) {
      this.playerTexts[winner.id].setStyle({ backgroundColor: "#FFD700" });

      // Show leader border for the trick winner
      this.showPlayerLeaderBorder(winner.id);
    }
  }

  private updateScores(): void {
    const gameState = this.gameManager.getGameState();

    gameState.partnerships.forEach((partnership) => {
      if (this.scoreTexts[partnership.id]) {
        const label = partnership.id === "ns_partnership" ? "N/S" : "E/W";
        this.scoreTexts[partnership.id].setText(`${label}: ${partnership.score}`);
      }
    });
  }

  private showBiddingUI(): void {
    console.log("🎯 CREATING BIDDING UI ELEMENTS!");
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    console.log("🎯 Screen dimensions:", width, "x", height);

    // Create bidding buttons - positioned at bottom to avoid trick area
    const buttonY = height - 200;
    const buttons: Phaser.GameObjects.Text[] = [];

    console.log("🎯 Button Y position:", buttonY, "Screen height:", height);

    // Add instruction text
    const instructionText = this.add
      .text(width / 2, buttonY - getResponsiveSpacing(50), "PLACE YOUR BID:", {
        fontSize: getResponsiveFontSizePx(24),
        color: "#FFD700",
        fontStyle: "bold",
        backgroundColor: "#000000",
        padding: { x: getResponsiveSpacing(20), y: getResponsiveSpacing(12) },
      })
      .setOrigin(0.5);

    console.log("🎯 Created instruction text at position:", width / 2, buttonY - 50);

    buttons.push(instructionText); // Add to cleanup list

    // Pass button - enhanced for mobile touch
    const passButtonSpacing = getResponsiveSpacing(180);
    const passButton = this.add
      .text(width / 2 - passButtonSpacing, buttonY, "PASS", {
        fontSize: getResponsiveFontSizePx(22),
        color: "#ffffff",
        backgroundColor: "#CC4444",
        padding: { x: getResponsiveSpacing(25), y: getResponsiveSpacing(15) },
      })
      .setOrigin(0.5);

    passButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      this.gameManager.placeBid(this.getHumanPlayer()?.id || "", null);
      this.clearBiddingUI(buttons);
    });

    buttons.push(passButton);
    console.log("🎯 Created PASS button at position:", width / 2 - 180, buttonY);

    // Bid buttons (2-6) - only show valid bids
    const gameState = this.gameManager.getGameState();
    const currentBid = gameState.currentHand.currentBid;
    const minBid = currentBid ? currentBid.amount + 1 : 2;

    console.log("🎯 Current bid amount:", currentBid?.amount || "none", "Min bid:", minBid);

    if (minBid <= 6) {
      // Enhanced spacing for mobile touch targets
      const buttonSpacing = getResponsiveSpacing(50);
      const startOffset = getResponsiveSpacing(80);

      for (let bid = minBid; bid <= 6; bid++) {
        const x = width / 2 - startOffset + (bid - 2) * buttonSpacing;
        const bidButton = this.add
          .text(x, buttonY, bid.toString(), {
            fontSize: getResponsiveFontSizePx(22),
            color: "#ffffff",
            backgroundColor: "#4a7c59",
            padding: {
              x: getResponsiveSpacing(20),
              y: getResponsiveSpacing(15),
            },
          })
          .setOrigin(0.5);

        bidButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
          this.gameManager.placeBid(this.getHumanPlayer()?.id || "", bid);
          this.clearBiddingUI(buttons);
        });

        buttons.push(bidButton);
        console.log(`🎯 Created bid button ${bid} at position:`, x, buttonY);
      }
    } else {
      // No valid bids available, show message
      const noBidsText = this.add
        .text(width / 2, buttonY, "Only PASS available", {
          fontSize: getResponsiveFontSizePx(18),
          color: "#CCCCCC",
          backgroundColor: "#444444",
          padding: { x: 15, y: 10 },
        })
        .setOrigin(0.5);
      buttons.push(noBidsText);
      console.log("🎯 No valid bids available, showing pass-only message");
    }

    console.log("🎯 Total buttons created:", buttons.length);
  }

  private clearBiddingUI(buttons: Phaser.GameObjects.Text[]): void {
    buttons.forEach((button) => button.destroy());
    // Update the bidding display to reflect the new bid
    this.updateBiddingDisplay();
  }

  private makeAIBid(): void {
    const gameState = this.gameManager.getGameState();
    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];

    if (currentPlayer.isHuman) return;

    console.log(
      `🎮 GameScene: Triggering AI bid for ${currentPlayer.name} (Player ${gameState.currentHand.currentPlayerIndex + 1})`
    );

    // Advanced AI bidding using BiddingAI system
    // Use different personalities for variety - could be configured per player
    const personalities: AIPersonality[] = [
      AIPersonality.BALANCED,
      AIPersonality.CONSERVATIVE,
      AIPersonality.AGGRESSIVE,
      AIPersonality.ADAPTIVE,
    ];

    // Assign personality based on player index for consistent behavior
    const personality = personalities[gameState.currentHand.currentPlayerIndex % personalities.length];

    // Use the sophisticated BiddingAI to calculate the optimal bid
    const bidAmount = this.biddingAI.calculateBid(currentPlayer.hand, gameState, personality);

    console.log(`🎮 GameScene: Placing bid - ${bidAmount === null ? "PASS" : `BID ${bidAmount}`}`);
    this.gameManager.placeBid(currentPlayer.id, bidAmount);
  }

  private createGameInfoDisplays(): void {
    const width = this.cameras.main.width;
    const _height = this.cameras.main.height;

    // Trump suit display (center top)
    this.trumpDisplay = this.add
      .text(width / 2, 100, "Trump: Not Set", {
        fontSize: getResponsiveFontSizePx(16),
        color: "#FFD700",
        backgroundColor: "#4a7c59",
        padding: { x: 15, y: 8 },
      })
      .setOrigin(0.5);
    this.trumpDisplay.setVisible(false);

    // Trick information (center, below trump)
    this.trickInfo = this.add
      .text(width / 2, 130, "Lead: None | Cards: 0/4", {
        fontSize: getResponsiveFontSizePx(14),
        color: "#ffffff",
        backgroundColor: "#333333",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5);
    this.trickInfo.setVisible(false);

    // Persistent current bid display (top right corner)
    this.persistentBidDisplay = this.add
      .text(width - 120, 50, "Current Bid: None", {
        fontSize: getResponsiveFontSizePx(16),
        color: "#FFD700",
        backgroundColor: "#4a4a4a",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5);
    this.persistentBidDisplay.setVisible(false);

    // Last trick winner display (below current bid display)
    this.lastTrickWinnerDisplay = this.add
      .text(width - 120, 80, "Last Trick: None", {
        fontSize: getResponsiveFontSizePx(14),
        color: "#FFD700",
        backgroundColor: "#2a5a3a",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5);
    this.lastTrickWinnerDisplay.setVisible(false);

    // Create bidding display
    this.createBiddingDisplay();

    // Create trick area for played cards
    this.createTrickArea();
  }

  private createBiddingDisplay(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Container for all bidding info
    this.biddingDisplay = this.add.container(width / 2, height / 2 - 50);

    // Current high bid display
    this.currentBidDisplay = this.add
      .text(0, -80, "Current Bid: None", {
        fontSize: getResponsiveFontSizePx(18),
        color: "#FFD700",
        backgroundColor: "#333333",
        padding: { x: 15, y: 8 },
      })
      .setOrigin(0.5);
    this.biddingDisplay.add(this.currentBidDisplay);

    // Player bid status displays
    const gameState = this.gameManager.getGameState();
    gameState.players.forEach((player, index) => {
      const angle = index * 90 - 90; // Start from top, go clockwise
      const radius = 120;
      const x = Math.cos((angle * Math.PI) / 180) * radius;
      const y = Math.sin((angle * Math.PI) / 180) * radius;

      const bidText = this.add
        .text(x, y, `${player.name}\nWaiting...`, {
          fontSize: getResponsiveFontSizePx(14),
          color: "#ffffff",
          backgroundColor: "#555555",
          padding: { x: 10, y: 6 },
          align: "center",
        })
        .setOrigin(0.5);

      this.playerBidTexts[player.id] = bidText;
      this.biddingDisplay.add(bidText);
    });

    this.biddingDisplay.setVisible(false);
  }

  private createTrickArea(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Container for played cards in the center
    this.trickArea = this.add.container(width / 2, height / 2);
    this.trickArea.setVisible(false);

    // Add a subtle background for the trick area
    const trickBackground = this.add.graphics();
    trickBackground.fillStyle(0x2a2a2a, 0.7);
    trickBackground.fillRoundedRect(-160, -110, 320, 220, 10);
    trickBackground.lineStyle(2, 0x555555);
    trickBackground.strokeRoundedRect(-160, -110, 320, 220, 10);
    this.trickArea.add(trickBackground);

    // Add trick label
    const trickLabel = this.add
      .text(0, -85, "Current Trick", {
        fontSize: getResponsiveFontSizePx(16),
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.trickArea.add(trickLabel);
  }

  private addCardToTrick(player: any, card: any): void {
    // Get current card count before adding new card
    const currentCardCount = Object.keys(this.playedCardSprites).length;

    console.log(`🎯 Adding card to trick: ${player.name} plays ${card.displayName}`);
    console.log(`🎯 Current cards in trick area: ${currentCardCount}`);
    console.log(
      `🎯 Existing cards:`,
      Object.keys(this.playedCardSprites).map((playerId) => {
        const p = this.gameManager.getPlayer(playerId);
        return `${p?.name}: ${this.playedCardSprites[playerId] ? "has card" : "no card"}`;
      })
    );

    // Always prevent more than 4 cards - this is the main protection
    if (currentCardCount >= 4) {
      console.warn("⚠️ Attempted to add 5th card to trick area - clearing and retrying");
      this.clearTrick(); // Force clear the UI
      console.log("🎯 Force cleared trick area due to desync");
      // Don't return - let it proceed to add the card now that area is clear
    }

    // Position cards based on player position
    let x = 0,
      y = 0;
    switch (player.position) {
      case "south": // Bottom
        x = 0;
        y = 30;
        break;
      case "north": // Top
        x = 0;
        y = -30;
        break;
      case "east": // Right
        x = 50;
        y = 0;
        break;
      case "west": // Left
        x = -50;
        y = 0;
        break;
    }

    // Remove any existing card from this player
    if (this.playedCardSprites[player.id]) {
      this.playedCardSprites[player.id].destroy();
    }

    // Create new card sprite for the played card
    const currentTheme = this.themeManager.getCurrentTheme();
    const cardSprite = new CardSprite(this, x, y, card, currentTheme);
    cardSprite.setScale(0.8); // Make trick cards smaller
    cardSprite.setSelectable(false); // Can't interact with played cards

    this.playedCardSprites[player.id] = cardSprite;
    this.trickArea.add(cardSprite);
  }

  private clearTrick(): void {
    console.log("🎯 CLEARING TRICK - removing all played cards");
    console.log(`🎯 Cards being removed:`, Object.keys(this.playedCardSprites).length);

    // Remove all played cards from the trick area
    Object.values(this.playedCardSprites).forEach((sprite) => sprite.destroy());
    this.playedCardSprites = {};

    // Clear leader borders when trick is cleared
    this.hideAllLeaderBorders();

    console.log("🎯 Trick cleared, playedCardSprites reset, leader borders hidden");
  }

  private updateBiddingDisplay(): void {
    const gameState = this.gameManager.getGameState();
    const currentBid = gameState.currentHand.currentBid;
    const currentPlayerIndex = gameState.currentHand.currentPlayerIndex;

    // Update current high bid
    if (currentBid) {
      const bidder = this.gameManager.getPlayer(currentBid.playerId);
      this.currentBidDisplay.setText(`High Bid: ${currentBid.amount} (${bidder?.name})`);
    } else {
      this.currentBidDisplay.setText("High Bid: None");
    }

    // Update each player's bid status
    gameState.players.forEach((player, index) => {
      const bidText = this.playerBidTexts[player.id];
      if (!bidText) return;

      let status = "";
      let backgroundColor = "#555555";

      // Check if this player has bid
      const playerBid = gameState.currentHand.bids?.find((b: Bid) => b.playerId === player.id);

      if (playerBid) {
        if (playerBid.passed) {
          status = "PASSED";
          backgroundColor = "#AA4444";
        } else {
          status = `BID: ${playerBid.amount}`;
          backgroundColor = "#44AA44";
        }
      } else if (index === currentPlayerIndex) {
        status = "BIDDING...";
        backgroundColor = "#AAAA44";
      } else {
        status = "Waiting...";
        backgroundColor = "#555555";
      }

      bidText.setText(`${player.name}\n${status}`);
      bidText.setStyle({ backgroundColor });
    });
  }

  private updateGameInfo(): void {
    const gameState = this.gameManager.getGameState();
    const trumpSuit = gameState.currentHand.trumpSuit;
    const currentTrick = gameState.currentHand.currentTrick;
    const leadSuit = currentTrick?.leadSuit;

    // Update trump suit display
    if (trumpSuit && this.trumpDisplay) {
      this.trumpDisplay.setText(`Trump: ${trumpSuit.toUpperCase()}`);
      this.trumpDisplay.setVisible(true);
    }

    // Update trick info
    if (leadSuit && this.trickInfo) {
      const cardsPlayed = currentTrick?.cards.length || 0;
      this.trickInfo.setText(`Lead: ${leadSuit.toUpperCase()} | Cards: ${cardsPlayed}/4`);
      this.trickInfo.setVisible(true);
    }
  }

  /**
   * Confirm the selected card play
   */
  private confirmCardPlay(): void {
    if (!this.selectionState.selectedCard) return;

    const gameState = this.gameManager.getGameState();
    const humanPlayer = gameState.players.find((p) => p.isHuman);

    if (!humanPlayer) return;

    const card = this.selectionState.selectedCard;
    console.log(`🎯 CONFIRMING CARD PLAY: ${card.displayName}`);

    // Validate one more time before playing
    const validation = validateCardPlay(card, humanPlayer, gameState);

    if (!validation.valid) {
      this.showInvalidSelectionFeedback(card, validation);
      this.cancelCardSelection();
      return;
    }

    // Play the card
    const success = this.gameManager.playCard(humanPlayer.id, card.id);

    if (success) {
      this.statusText.setText(`✅ Played ${card.displayName} successfully`);
      this.hideConfirmationUI();
      this.clearSelection();
      this.updateHand();
      this.updateGameInfo();

      // Force update turn indicator to ensure it's current
      this.updateTurnIndicator();

      // Update card states to match new turn
      this.updateCardSelectionStates();

      // Continue with AI players
      this.time.delayedCall(1000, () => {
        this.makeAIPlay();
      });
    } else {
      this.showInvalidSelectionFeedback(card, {
        valid: false,
        reason: "Card play failed",
      });
      this.cancelCardSelection();
    }
  }

  /**
   * Cancel card selection
   */
  private cancelCardSelection(): void {
    console.log("🎯 CANCELLING CARD SELECTION");

    this.hideConfirmationUI();
    this.clearSelection();
    this.updateCardSelectionStates();
    this.updateGameStatus();
  }

  /**
   * Clear current selection state
   */
  private clearSelection(): void {
    this.selectionState = {
      selectedCard: null,
      confirmationRequired: true,
      selectionTime: 0,
    };
  }

  /**
   * Hide confirmation UI
   */
  private hideConfirmationUI(): void {
    this.confirmButton.setVisible(false);
    this.cancelButton.setVisible(false);
  }

  /**
   * Update visual selection states for all cards
   */
  private updateCardSelectionStates(): void {
    const gameState = this.gameManager.getGameState();
    const humanPlayer = gameState.players.find((p) => p.isHuman);

    if (!humanPlayer) return;

    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];
    const isHumanTurn = currentPlayer.id === humanPlayer.id;

    console.log(
      `🎯 UPDATING CARD STATES: Current player: ${currentPlayer.name}, isHuman: ${currentPlayer.isHuman}, isHumanTurn: ${isHumanTurn}`
    );

    this.cardSprites.forEach((sprite) => {
      const card = sprite.getCard();
      const isSelected = this.selectionState.selectedCard?.id === card.id;

      const displayState = isHumanTurn
        ? getCardDisplayState(card, humanPlayer, gameState, isSelected)
        : {
            playable: false,
            selected: isSelected,
            highlighted: false,
            dimmed: true,
            reason: `${currentPlayer.name} is playing - wait for your turn`,
          };

      sprite.setDisplayState(displayState);
    });
  }

  /**
   * Show feedback for invalid card selection
   */
  private showInvalidSelectionFeedback(_card: any, validation: any): void {
    const errorType = getInteractionError(validation);
    const message = getErrorDisplayMessage(errorType, {
      reason: validation.reason,
      currentPlayer: this.getCurrentPlayerName(),
    });

    this.statusText.setText(message);

    // Play error feedback
    this.playErrorFeedback();

    // Auto-clear after 3 seconds
    this.time.delayedCall(3000, () => {
      this.updateGameStatus();
    });
  }

  /**
   * Play error feedback
   */
  private playErrorFeedback(): void {
    // TODO: Add error audio feedback
    // this.sound.play('error');

    // Stronger haptic feedback for errors
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }

  /**
   * Update game status text
   */
  private updateGameStatus(): void {
    const gameState = this.gameManager.getGameState();
    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];

    if (gameState.gamePhase === "playing") {
      if (currentPlayer.isHuman) {
        this.statusText.setText("Your turn to play a card");
      } else {
        this.statusText.setText(`${currentPlayer.name} is playing...`);
      }
    } else if (gameState.gamePhase === "bidding") {
      if (currentPlayer.isHuman) {
        this.statusText.setText("Your turn to bid");
      } else {
        this.statusText.setText(`${currentPlayer.name} is bidding...`);
      }
    }
  }

  /**
   * Get current player name for error messages
   */
  private getCurrentPlayerName(): string {
    const gameState = this.gameManager.getGameState();
    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];
    return currentPlayer.name;
  }

  private makeAIPlay(): void {
    const gameState = this.gameManager.getGameState();

    console.log("🤖 makeAIPlay called, game phase:", gameState.gamePhase);

    if (gameState.gamePhase !== "playing") {
      console.log("🤖 Not in playing phase, returning");
      return;
    }

    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];
    console.log("🤖 Current player:", currentPlayer.name, "isHuman:", currentPlayer.isHuman);

    if (currentPlayer.isHuman) {
      console.log("🤖 Current player is human, returning");
      return;
    }

    // Simple AI: play first valid card
    const trumpSuit = gameState.currentHand.trumpSuit;
    const leadSuit = gameState.currentHand.currentTrick?.leadSuit;

    console.log("🤖 Trump suit:", trumpSuit, "Lead suit:", leadSuit);
    console.log(
      "🤖 AI hand:",
      currentPlayer.hand.map((c) => c.displayName)
    );

    // Check if player has any cards left
    if (currentPlayer.hand.length === 0) {
      console.log("🤖 AI has no cards left, cannot play");
      this.statusText.setText(`${currentPlayer.name} has no cards left`);
      return;
    }

    // Smart AI card selection logic
    const leadCard = gameState.currentHand.currentTrick?.cards[0]?.card;
    const cardToPlay = this.selectBestAICard(currentPlayer, leadSuit, trumpSuit, leadCard);

    console.log("🤖 AI will play:", cardToPlay.displayName);

    const success = this.gameManager.playCard(currentPlayer.id, cardToPlay.id);
    console.log("🤖 Play result:", success);

    if (success) {
      this.statusText.setText(`${currentPlayer.name} played ${cardToPlay.displayName}`);

      // Force update turn indicator after AI play
      this.updateTurnIndicator();

      // Update card states after AI play
      this.updateCardSelectionStates();

      // Continue AI turns or back to human
      this.time.delayedCall(1000, () => {
        const newState = this.gameManager.getGameState();
        const nextPlayer = newState.players[newState.currentHand.currentPlayerIndex];

        if (!nextPlayer.isHuman && newState.gamePhase === "playing") {
          this.makeAIPlay();
        }
      });
    } else {
      // If play failed, try a different strategy
      console.warn("🤖 AI play failed, trying alternative card");
      this.retryAIPlay(currentPlayer, leadSuit, trumpSuit, cardToPlay);
    }
  }

  private selectBestAICard(player: any, leadSuit: any, trumpSuit: any, leadCard?: any): any {
    // First priority: Follow suit if required
    if (leadSuit) {
      const followCard = player.hand.find((card: any) => card.canFollow(leadSuit, player.hand, trumpSuit, leadCard));
      if (followCard) {
        return followCard;
      }
    }

    // Second priority: If leading (no lead suit), avoid joker if trump not established
    if (!leadSuit && !trumpSuit) {
      // Cannot lead with joker when trump isn't established
      const nonJokerCards = player.hand.filter((card: any) => !card.isJoker);
      if (nonJokerCards.length > 0) {
        // Prefer high cards when leading to establish strong trump
        const sortedCards = [...nonJokerCards].sort((a: any, b: any) => b.rank - a.rank);
        return sortedCards[0];
      }
    }

    // Third priority: Play any valid card (should not reach here if trump not set and only joker available)
    const validCards = player.hand.filter((card: any) => {
      // Don't play joker if trump not established and we're leading
      if (card.isJoker && !trumpSuit && !leadSuit) {
        return false;
      }
      return true;
    });

    if (validCards.length > 0) {
      return validCards[0];
    }

    // Fallback: just play first card (this should rarely happen)
    return player.hand[0];
  }

  private retryAIPlay(player: any, leadSuit: any, trumpSuit: any, failedCard: any): void {
    console.warn("🤖 Retrying AI play, failed card was:", failedCard.displayName);

    // Find any card that is NOT the failed card
    const alternativeCards = player.hand.filter((card: any) => card.id !== failedCard.id);

    if (alternativeCards.length === 0) {
      console.error("🤖 AI has no alternative cards to play!");
      this.statusText.setText(`${player.name} cannot play any card - game error`);
      return;
    }

    // Use more conservative selection for retry
    let retryCard = alternativeCards[0]; // Default fallback

    // If trump not established, absolutely avoid jokers
    if (!trumpSuit && !leadSuit) {
      const nonJokerAlternatives = alternativeCards.filter((card: any) => !card.isJoker);
      if (nonJokerAlternatives.length > 0) {
        retryCard = nonJokerAlternatives[0];
      }
    }

    console.log("🤖 AI retry playing:", retryCard.displayName);

    const success = this.gameManager.playCard(player.id, retryCard.id);

    if (success) {
      this.statusText.setText(`${player.name} played ${retryCard.displayName}`);

      // Force update turn indicator after AI retry
      this.updateTurnIndicator();

      // Update card states after AI retry
      this.updateCardSelectionStates();

      // Continue the game flow
      this.time.delayedCall(1000, () => {
        const newState = this.gameManager.getGameState();
        const nextPlayer = newState.players[newState.currentHand.currentPlayerIndex];

        if (!nextPlayer.isHuman && newState.gamePhase === "playing") {
          this.makeAIPlay();
        }
      });
    } else {
      console.error("🤖 AI retry also failed!");
      this.statusText.setText(`${player.name} cannot play - game stuck`);
    }
  }

  private getHumanPlayer(): Player | undefined {
    const gameState = this.gameManager.getGameState();
    return gameState.players.find((p) => p.isHuman);
  }

  /**
   * Handle keyboard card selection
   */
  private onKeyboardCardSelected(event: any): void {
    const { card, sprite } = event;
    this.onEnhancedCardSelected(card, {
      action: "select",
      playable: sprite.getDisplayState().playable,
      method: "keyboard",
    });
  }

  /**
   * Handle keyboard card confirmation
   */
  private onKeyboardCardConfirmed(_event: any): void {
    this.confirmCardPlay();
  }

  /**
   * Handle keyboard card cancellation
   */
  private onKeyboardCardCancelled(_event: any): void {
    this.cancelCardSelection();
  }

  /**
   * Handle accessibility announcements
   */
  private onAccessibilityAnnouncement(event: any): void {
    // Update status text for visual users as well
    this.statusText.setText(event.text);

    // Auto-clear after 3 seconds unless it's an important message
    if (!event.text.includes("Selected") && !event.text.includes("Error")) {
      this.time.delayedCall(3000, () => {
        this.updateGameStatus();
      });
    }
  }

  /**
   * Handle card playability changes
   */
  private onCardPlayabilityChanged(_event: any): void {
    // Update visual states when playability changes
    this.updateCardSelectionStates();

    // Update keyboard manager with new selectable cards
    const selectableCards = this.cardSprites.filter((sprite) => sprite.getDisplayState().playable);
    this.keyboardManager.updateSelectableCards(selectableCards);
  }

  /**
   * Force update the turn indicator with current game state
   */
  private updateTurnIndicator(): void {
    const gameState = this.gameManager.getGameState();
    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];

    let instruction = "";
    if (gameState.gamePhase === "bidding") {
      instruction = currentPlayer.isHuman ? "Your turn to bid" : `${currentPlayer.name} is bidding...`;
    } else if (gameState.gamePhase === "playing") {
      instruction = currentPlayer.isHuman ? "Your turn to play a card" : `${currentPlayer.name} is playing...`;
    }

    console.log(`🔄 FORCE UPDATING turn indicator: ${currentPlayer.name} - ${instruction}`);
    this.turnIndicator.showPlayerTurn(currentPlayer, instruction);
  }

  /**
   * Handle current player changes
   */
  private onCurrentPlayerChanged(event: any): void {
    console.log("🔄 CURRENT PLAYER CHANGED EVENT:", event);
    const { currentPlayer, previousPlayer } = event;

    // Update turn indicator
    let instruction = "";
    if (this.gameManager.getGameState().gamePhase === "bidding") {
      instruction = currentPlayer.isHuman ? "Your turn to bid" : `${currentPlayer.name} is bidding...`;
    } else if (this.gameManager.getGameState().gamePhase === "playing") {
      instruction = currentPlayer.isHuman ? "Your turn to play a card" : `${currentPlayer.name} is playing...`;
    }

    console.log(`🔄 Updating turn indicator: ${currentPlayer.name} - ${instruction}`);
    this.turnIndicator.showPlayerTurn(currentPlayer, instruction);

    // Update card states when current player changes
    this.updateCardSelectionStates();

    // Clear any existing selection when turn changes
    if (previousPlayer?.isHuman && !currentPlayer.isHuman) {
      this.cancelCardSelection();
    }

    // Update keyboard navigation state
    if (currentPlayer.isHuman) {
      this.keyboardManager.enable();
    } else {
      this.keyboardManager.disable();
    }
  }

  private updatePersistentBidDisplay(): void {
    const gameState = this.gameManager.getGameState();
    const currentBid = gameState.currentHand.currentBid;

    if (currentBid) {
      const bidder = this.gameManager.getPlayer(currentBid.playerId);
      this.persistentBidDisplay.setText(`Current Bid: ${currentBid.amount} (${bidder?.name})`);
    } else {
      this.persistentBidDisplay.setText("Current Bid: None");
    }
  }

  private showHandCompleteUI(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);

    // Hand complete message
    const messageText = this.add
      .text(width / 2, height / 2 - 80, "Hand Complete!", {
        fontSize: "32px",
        color: "#FFD700",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Score summary (from stored completed hand data)
    const actualTricks = this.completedHandData?.tricksPlayed || 0;
    const trumpSuit = this.completedHandData?.trumpSuit || "undefined";
    const tricksText = `${actualTricks} tricks played\nTrump suit was: ${trumpSuit.toUpperCase()}`;
    console.log("🏁 Hand Complete UI - Using stored data:");
    console.log("🏁 Hand Complete UI - Actual tricks played:", actualTricks);
    console.log("🏁 Hand Complete UI - Trump suit:", trumpSuit);

    const scoreText = this.add
      .text(width / 2, height / 2 - 20, tricksText, {
        fontSize: getResponsiveFontSizePx(18),
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    // Options
    const newHandButton = this.add
      .text(width / 2 - 80, height / 2 + 50, "NEW HAND", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#4a7c59",
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5);

    const menuButton = this.add
      .text(width / 2 + 80, height / 2 + 50, "MAIN MENU", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#666666",
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5);

    // Add interactivity
    newHandButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      // Start a new hand
      overlay.destroy();
      messageText.destroy();
      scoreText.destroy();
      newHandButton.destroy();
      menuButton.destroy();
      this.startNewHand();
    });

    menuButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      this.scene.start("MenuScene");
    });
  }

  private startNewHand(): void {
    // For now, just restart the current scene
    this.scene.restart({
      players: [
        { name: "You", isHuman: true },
        { name: "West AI", isHuman: false },
        { name: "North AI", isHuman: false },
        { name: "East AI", isHuman: false },
      ],
    });
  }

  private showGameOverUI(winner: any, finalScores: any[], targetScore: number): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Cleanup interaction components
    this.cleanupInteractionComponents();

    // Create overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0);

    // Game Over title
    const titleText = this.add
      .text(width / 2, height / 2 - 120, "🏆 GAME OVER! 🏆", {
        fontSize: "36px",
        color: "#FFD700",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Winner announcement
    const winnerLabel = winner.id === "ns_partnership" ? "North/South" : "East/West";
    const winnerText = this.add
      .text(width / 2, height / 2 - 70, `${winnerLabel} Partnership Wins!`, {
        fontSize: "24px",
        color: "#FFD700",
      })
      .setOrigin(0.5);

    // Final scores display
    const scoresText = finalScores
      .map((partnership) => {
        const label = partnership.id === "ns_partnership" ? "North/South" : "East/West";
        return `${label}: ${partnership.score} points`;
      })
      .join("\n");

    const finalScoresText = this.add
      .text(width / 2, height / 2 - 20, `Final Scores:\n${scoresText}\n\nTarget: ${targetScore} points`, {
        fontSize: getResponsiveFontSizePx(18),
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    // New Game button
    const newGameButton = this.add
      .text(width / 2 - 100, height / 2 + 80, "NEW GAME", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#4a7c59",
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5);

    // Main Menu button
    const menuButton = this.add
      .text(width / 2 + 100, height / 2 + 80, "MAIN MENU", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#666666",
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5);

    // Add interactivity
    newGameButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      // Clean up UI elements
      overlay.destroy();
      titleText.destroy();
      winnerText.destroy();
      finalScoresText.destroy();
      newGameButton.destroy();
      menuButton.destroy();

      // Start a new game
      this.scene.restart({
        players: [
          { name: "You", isHuman: true },
          { name: "West AI", isHuman: false },
          { name: "North AI", isHuman: false },
          { name: "East AI", isHuman: false },
        ],
      });
    });

    menuButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      this.cleanupInteractionComponents();
      this.scene.start("MenuScene");
    });
  }

  /**
   * Cleanup interaction components when leaving scene
   */
  private cleanupInteractionComponents(): void {
    // Cleanup keyboard manager
    if (this.keyboardManager) {
      this.keyboardManager.destroy();
    }

    // Cleanup turn indicator
    if (this.turnIndicator) {
      this.turnIndicator.hide();
    }

    // Hide any active tooltips
    this.cardSprites.forEach((sprite) => {
      sprite.hideTooltip();
    });

    // Cleanup tooltip pool
    CardTooltip.destroyPool();

    // Clear selection state
    this.clearSelection();
    this.hideConfirmationUI();
  }

  /**
   * Handle enhanced card selection with validation
   */
  private onEnhancedCardSelected(card: any, _event: any): void {
    const gameState = this.gameManager.getGameState();
    const humanPlayer = gameState.players.find((p) => p.isHuman);

    if (!humanPlayer) return;

    const validation = validateCardPlay(card, humanPlayer, gameState);
    if (!validation.valid) {
      this.showInvalidSelectionFeedback(card, validation);
      return;
    }

    this.selectionState = {
      selectedCard: card,
      confirmationRequired: requiresConfirmation(card, gameState),
      selectionTime: Date.now(),
    };

    this.showConfirmationUI(card);
  }

  /**
   * Handle enhanced card confirmation
   */
  private onEnhancedCardConfirmed(_card: any, _event: any): void {
    this.confirmCardPlay();
  }

  /**
   * Handle enhanced card cancellation
   */
  private onEnhancedCardCancelled(_card: any, _event: any): void {
    this.cancelCardSelection();
  }

  /**
   * Handle card hover start
   */
  private onCardHoverStart(card: any, event: any): void {
    // Update status text with card info
    if (event.playable) {
      this.statusText.setText(`Hover: ${card.displayName} - Click to select`);
    } else {
      this.statusText.setText(`${card.displayName} - ${event.reason || "Cannot play"}`);
    }
  }

  /**
   * Handle card hover end
   */
  private onCardHoverEnd(_card: any, _event: any): void {
    // Reset status text
    this.updateGameStatus();
  }

  /**
   * Handle card long press for mobile
   */
  private onCardLongPress(card: any, event: any): void {
    // Show detailed card information or context menu
    this.statusText.setText(`Long press: ${card.displayName} - ${event.reason || "Card info"}`);
  }

  /**
   * Handle tooltip request with fresh game state
   */
  private onTooltipRequested(card: any, event: any): void {
    const gameState = this.gameManager.getGameState();
    const humanPlayer = gameState.players.find((p) => p.isHuman);

    if (!humanPlayer) return;

    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];
    const isHumanTurn = currentPlayer.id === humanPlayer.id;

    console.log(
      `🏷️ TOOLTIP REQUEST: Card ${card.displayName}, Current player: ${currentPlayer.name} (isHuman: ${currentPlayer.isHuman}), isHumanTurn: ${isHumanTurn}`
    );

    // Get fresh display state
    const displayState = isHumanTurn
      ? getCardDisplayState(card, humanPlayer, gameState, this.selectionState.selectedCard?.id === card.id)
      : {
          playable: false,
          selected: this.selectionState.selectedCard?.id === card.id,
          highlighted: false,
          dimmed: true,
          reason: `${currentPlayer.name} is playing - wait for your turn`,
        };

    console.log(`🏷️ TOOLTIP DISPLAY STATE: playable=${displayState.playable}, reason="${displayState.reason}"`);

    // Show tooltip with fresh information
    event.tooltip.showForCard(card, event.x, event.y, displayState.playable, displayState.reason);
  }

  /**
   * Show confirmation UI for selected card
   */
  private showConfirmationUI(card: any): void {
    if (this.selectionState.confirmationRequired) {
      this.confirmButton.setVisible(true);
      this.cancelButton.setVisible(true);
      this.statusText.setText(
        `Selected ${card.displayName} - Click CONFIRM to play or CANCEL to choose different card`
      );
    } else {
      // Auto-confirm for non-critical plays
      this.time.delayedCall(500, () => {
        this.confirmCardPlay();
      });
    }
  }

  /**
   * Override destroy to cleanup resources
   */
  destroy(): void {
    this.cleanupInteractionComponents();
    // Note: Phaser Scene doesn't have a destroy method, use shutdown instead
    this.scene.stop();
  }
}
