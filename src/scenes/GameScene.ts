import { Scene } from "phaser";
import { CardSprite } from "@/components/CardSprite";
import { CardThemeManager } from "@/managers/CardThemeManager";
import { GameManager } from "@/managers/GameManager";
import type { Bid, Player, GameConfig as SetbackGameConfig } from "@/types/game";

interface SceneData {
  players: Array<{
    name: string;
    isHuman: boolean;
  }>;
}

export class GameScene extends Scene {
  private gameManager!: GameManager;
  private themeManager!: CardThemeManager;
  private playerTexts: { [playerId: string]: Phaser.GameObjects.Text } = {};
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
  private trickArea!: Phaser.GameObjects.Container;
  private playedCardSprites: { [playerId: string]: CardSprite } = {};
  private isHandCompleting: boolean = false;
  private completedHandData: { tricksPlayed: number; trumpSuit: string } | null = null;
  private handCompleteTimers: Phaser.Time.TimerEvent[] = [];

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
    this.setupGameEvents();
  }

  create(): void {
    console.log("🎮 GameScene created");
    this.createUI();
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
    this.gameManager.on("nextHandStarted", this.onNextHandStarted.bind(this));
    this.gameManager.on("deckReshuffled", this.onDeckReshuffled.bind(this));
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
        fontSize: "16px",
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
          fontSize: "18px",
          color: "#ffffff",
          backgroundColor: player.isDealer ? "#6a4c93" : "#444444",
          padding: { x: 15, y: 8 },
        })
        .setOrigin(0.5);

      this.playerTexts[player.id] = playerText;
    });
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
    // Clear existing cards
    this.cardSprites.forEach((sprite) => sprite.destroy());
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
    console.log(`🎯 Current player: ${gameState.players[gameState.currentHand.currentPlayerIndex].name}`);

    // Display human player's hand using CardSprite
    const cardSpacing = 100;
    const startX = (-(humanPlayer.hand.length - 1) * cardSpacing) / 2;
    const currentTheme = this.themeManager.getCurrentTheme();

    humanPlayer.hand.forEach((card, index) => {
      const x = startX + index * cardSpacing;

      // Create beautiful CardSprite
      const cardSprite = new CardSprite(this, x, 0, card, currentTheme);

      // Determine if this card is playable and provide visual feedback
      const isPlayable = this.isCardPlayable(card, gameState);

      // Visual feedback for playable/non-playable cards during playing phase
      if (gameState.gamePhase === "playing" && gameState.players[gameState.currentHand.currentPlayerIndex].isHuman) {
        if (isPlayable) {
          cardSprite.setSelectable(true);
        } else {
          cardSprite.setSelectable(false);
          cardSprite.setAlpha(0.6); // Dim non-playable cards
        }
      }

      // Add click handler for card play
      cardSprite.on("cardSelected", (_event: any) => {
        this.onCardSelected(card);
      });

      this.cardSprites.push(cardSprite);
      this.handContainer.add(cardSprite);
    });
  }

  private isCardPlayable(card: any, gameState: any): boolean {
    const currentTrick = gameState.currentHand.currentTrick;
    const leadSuit = currentTrick?.leadSuit;
    const trumpSuit = gameState.currentHand.trumpSuit;
    const humanPlayer = gameState.players.find((p: any) => p.isHuman);

    if (!humanPlayer) return false;

    // First card cannot be a joker
    if (card.isJoker && !trumpSuit) {
      return false;
    }

    // If there's a lead suit, check if we can follow
    if (leadSuit && card.suit !== leadSuit && !card.isJoker) {
      // Check if player has cards of the lead suit
      const hasLeadSuit = humanPlayer.hand.some((c: any) => c.suit === leadSuit && !c.isJoker);
      if (hasLeadSuit) {
        return false; // Must follow suit
      }
    }

    return true;
  }

  private onGameStarted(): void {
    console.log("🎮 Game started event received");
    this.statusText.setText("Game Started - Dealing Cards...");
    this.updateHand();
    this.updateScores();
  }

  private onBiddingStarted(): void {
    console.log("🎯 BIDDING STARTED EVENT RECEIVED!");
    this.statusText.setText("🎯 Bidding Phase Started!");
    this.highlightCurrentPlayer();

    // Show the bidding displays
    this.biddingDisplay.setVisible(true);
    this.persistentBidDisplay.setVisible(true);
    this.updateBiddingDisplay();
    this.updatePersistentBidDisplay();

    // Check who the current player is
    const gameState = this.gameManager.getGameState();
    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];

    console.log("🎯 Current player:", currentPlayer.name, "isHuman:", currentPlayer.isHuman);
    console.log(
      "🎯 All players:",
      gameState.players.map((p) => `${p.name}(${p.isHuman ? "Human" : "AI"})`)
    );

    if (currentPlayer.isHuman) {
      console.log("🎯 SHOWING BIDDING UI FOR HUMAN!");
      this.statusText.setText("🎯 Your turn to bid!");
      this.showBiddingUI();
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

      if (currentPlayer.isHuman) {
        console.log("🎯 SHOWING BIDDING UI AFTER AI BID!");
        this.statusText.setText("🎯 Your turn to bid!");
        this.showBiddingUI();
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

    // Show trick area and hide bidding display
    this.biddingDisplay.setVisible(false);
    this.trickArea.setVisible(true);
    this.updateGameInfo();

    // Check if current player is AI and start their turn
    const gameState = this.gameManager.getGameState();
    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];

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

  private onNextHandStarted(_gameState: any): void {
    console.log("🔄 Next hand started event received");
    this.isHandCompleting = false;

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
      this.playerTexts[currentPlayer.id].setStyle({ backgroundColor: "#6a4c93" });
    }
  }

  private highlightTrickWinner(winner: any): void {
    // Reset all player text styles
    Object.values(this.playerTexts).forEach((text) => {
      text.setStyle({ backgroundColor: "#444444" });
    });

    // Highlight trick winner with a special color
    if (winner && this.playerTexts[winner.id]) {
      this.playerTexts[winner.id].setStyle({ backgroundColor: "#FFD700" });
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
      .text(width / 2, buttonY - 50, "PLACE YOUR BID:", {
        fontSize: "24px",
        color: "#FFD700",
        fontStyle: "bold",
        backgroundColor: "#000000",
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5);

    console.log("🎯 Created instruction text at position:", width / 2, buttonY - 50);

    buttons.push(instructionText); // Add to cleanup list

    // Pass button
    const passButton = this.add
      .text(width / 2 - 180, buttonY, "PASS", {
        fontSize: "22px",
        color: "#ffffff",
        backgroundColor: "#CC4444",
        padding: { x: 25, y: 15 },
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
      for (let bid = minBid; bid <= 6; bid++) {
        const x = width / 2 - 80 + (bid - 2) * 50;
        const bidButton = this.add
          .text(x, buttonY, bid.toString(), {
            fontSize: "22px",
            color: "#ffffff",
            backgroundColor: "#4a7c59",
            padding: { x: 20, y: 15 },
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
          fontSize: "18px",
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

    // Simple AI bidding logic - random for now
    const shouldBid = Math.random() > 0.5;
    let bidAmount: number | null = null;

    if (shouldBid) {
      const currentBid = gameState.currentHand.currentBid;
      const minBid = currentBid ? currentBid.amount + 1 : 2;
      const maxBid = Math.min(6, minBid + 2);

      if (minBid <= maxBid) {
        bidAmount = Math.floor(Math.random() * (maxBid - minBid + 1)) + minBid;
      }
    }

    this.gameManager.placeBid(currentPlayer.id, bidAmount);
  }

  private createGameInfoDisplays(): void {
    const width = this.cameras.main.width;
    const _height = this.cameras.main.height;

    // Trump suit display (center top)
    this.trumpDisplay = this.add
      .text(width / 2, 100, "Trump: Not Set", {
        fontSize: "16px",
        color: "#FFD700",
        backgroundColor: "#4a7c59",
        padding: { x: 15, y: 8 },
      })
      .setOrigin(0.5);
    this.trumpDisplay.setVisible(false);

    // Trick information (center, below trump)
    this.trickInfo = this.add
      .text(width / 2, 130, "Lead: None | Cards: 0/4", {
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "#333333",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5);
    this.trickInfo.setVisible(false);

    // Persistent current bid display (top right corner)
    this.persistentBidDisplay = this.add
      .text(width - 120, 50, "Current Bid: None", {
        fontSize: "16px",
        color: "#FFD700",
        backgroundColor: "#4a4a4a",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5);
    this.persistentBidDisplay.setVisible(false);

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
        fontSize: "18px",
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
          fontSize: "14px",
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
        fontSize: "16px",
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

    console.log("🎯 Trick cleared, playedCardSprites reset");
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

  private onCardSelected(card: any): void {
    const gameState = this.gameManager.getGameState();

    console.log("🎯 CARD SELECTED:", card.displayName);

    // Only allow card play during playing phase and if it's human player's turn
    if (gameState.gamePhase !== "playing") {
      this.statusText.setText("❌ Not in playing phase - wait for bidding to complete");
      return;
    }

    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];
    if (!currentPlayer.isHuman) {
      this.statusText.setText("❌ Not your turn - wait for other players");
      return;
    }

    // CRITICAL CHECK: Verify player actually has cards
    if (currentPlayer.hand.length === 0) {
      console.error("🚨 CRITICAL: Player trying to play card but has no cards!");
      this.statusText.setText("⚠️ Error: You have no cards to play");
      return;
    }

    console.log(`🎯 Player has ${currentPlayer.hand.length} cards available`);
    console.log(
      `🎯 Player cards:`,
      currentPlayer.hand.map((c) => c.displayName)
    );

    // Enhanced validation and feedback
    const success = this.gameManager.playCard(currentPlayer.id, card.id);
    if (success) {
      this.statusText.setText(`✅ Played ${card.displayName} successfully`);
      this.updateHand();
      this.updateGameInfo();

      // Continue with AI players after a short delay
      this.time.delayedCall(1000, () => {
        this.makeAIPlay();
      });
    } else {
      // Get detailed invalid play reason
      this.showInvalidPlayFeedback(card, gameState);
    }
  }

  private showInvalidPlayFeedback(card: any, gameState: any): void {
    const currentTrick = gameState.currentHand.currentTrick;
    const leadSuit = currentTrick?.leadSuit;
    const trumpSuit = gameState.currentHand.trumpSuit;
    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];

    // Determine why the play is invalid
    if (card.isJoker && !trumpSuit) {
      this.statusText.setText("❌ Cannot lead with Joker - play a regular card first");
    } else if (leadSuit && card.suit !== leadSuit) {
      // Check if player has cards of the lead suit
      const hasLeadSuit = currentPlayer.hand.some((c: any) => c.suit === leadSuit && !c.isJoker);
      if (hasLeadSuit) {
        this.statusText.setText(`❌ Must follow ${leadSuit} suit - you have ${leadSuit} cards`);
      } else {
        this.statusText.setText(`❌ Unexpected error playing ${card.displayName}`);
      }
    } else {
      this.statusText.setText(`❌ Invalid play: ${card.displayName}`);
    }
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
    const cardToPlay = this.selectBestAICard(currentPlayer, leadSuit, trumpSuit);

    console.log("🤖 AI will play:", cardToPlay.displayName);

    const success = this.gameManager.playCard(currentPlayer.id, cardToPlay.id);
    console.log("🤖 Play result:", success);

    if (success) {
      this.statusText.setText(`${currentPlayer.name} played ${cardToPlay.displayName}`);

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

  private selectBestAICard(player: any, leadSuit: any, trumpSuit: any): any {
    // First priority: Follow suit if required
    if (leadSuit) {
      const followCard = player.hand.find((card: any) => card.canFollow(leadSuit, player.hand, trumpSuit));
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
        fontSize: "18px",
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
}
