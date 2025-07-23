import { Scene } from 'phaser';
import { GameManager } from '@/managers/GameManager';
import { GameConfig as SetbackGameConfig, Player, GamePhase, Bid } from '@/types/game';

interface SceneData {
  players: Array<{
    name: string;
    isHuman: boolean;
  }>;
}

export class GameScene extends Scene {
  private gameManager!: GameManager;
  private playerTexts: { [playerId: string]: Phaser.GameObjects.Text } = {};
  private scoreTexts: { [partnershipId: string]: Phaser.GameObjects.Text } = {};
  private statusText!: Phaser.GameObjects.Text;
  private handContainer!: Phaser.GameObjects.Container;
  private cardSprites: Phaser.GameObjects.Image[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: SceneData): void {
    const gameConfig: SetbackGameConfig = {
      targetScore: 21,
      players: data.players
    };

    this.gameManager = new GameManager(gameConfig);
    this.setupGameEvents();
  }

  create(): void {
    this.createUI();
    this.gameManager.startGame();
  }

  private setupGameEvents(): void {
    this.gameManager.on('gameStarted', this.onGameStarted.bind(this));
    this.gameManager.on('biddingStarted', this.onBiddingStarted.bind(this));
    this.gameManager.on('bidPlaced', this.onBidPlaced.bind(this));
    this.gameManager.on('biddingEnded', this.onBiddingEnded.bind(this));
    this.gameManager.on('playStarted', this.onPlayStarted.bind(this));
  }

  private createUI(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.tileSprite(0, 0, width, height, 'table-felt').setOrigin(0);

    // Create player areas
    this.createPlayerAreas();
    
    // Create score display
    this.createScoreDisplay();
    
    // Create status display
    this.statusText = this.add.text(width / 2, 50, 'Starting Game...', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);

    // Create hand area for human player
    this.createHandArea();

    // Back to menu button
    const menuButton = this.add.text(50, 50, 'MENU', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#666666',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);

    menuButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('MenuScene');
      });
  }

  private createPlayerAreas(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const gameState = this.gameManager.getGameState();

    gameState.players.forEach((player: Player) => {
      let x: number, y: number;
      
      switch (player.position) {
        case 'south': // Human player (bottom)
          x = width / 2;
          y = height - 100;
          break;
        case 'north': // Top
          x = width / 2;
          y = 100;
          break;
        case 'east': // Right
          x = width - 150;
          y = height / 2;
          break;
        case 'west': // Left
          x = 150;
          y = height / 2;
          break;
        default:
          x = 0;
          y = 0;
      }

      const playerText = this.add.text(x, y, player.name, {
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#444444',
        padding: { x: 15, y: 8 }
      }).setOrigin(0.5);

      this.playerTexts[player.id] = playerText;
    });
  }

  private createScoreDisplay(): void {
    const width = this.cameras.main.width;
    const gameState = this.gameManager.getGameState();

    // North/South partnership score (left side)
    const nsPartnership = gameState.partnerships[0];
    this.scoreTexts[nsPartnership.id] = this.add.text(100, 150, 
      `N/S: ${nsPartnership.score}`, {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#2a5a3a',
      padding: { x: 15, y: 10 }
    }).setOrigin(0.5);

    // East/West partnership score (right side) 
    const ewPartnership = gameState.partnerships[1];
    this.scoreTexts[ewPartnership.id] = this.add.text(width - 100, 150,
      `E/W: ${ewPartnership.score}`, {
      fontSize: '20px',
      color: '#ffffff', 
      backgroundColor: '#2a5a3a',
      padding: { x: 15, y: 10 }
    }).setOrigin(0.5);
  }

  private createHandArea(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.handContainer = this.add.container(width / 2, height - 150);
  }

  private updateHand(): void {
    // Clear existing cards
    this.cardSprites.forEach(sprite => sprite.destroy());
    this.cardSprites = [];
    
    const gameState = this.gameManager.getGameState();
    const humanPlayer = gameState.players.find(p => p.isHuman);
    
    if (!humanPlayer) return;

    // Display human player's hand
    const cardSpacing = 90;
    const startX = -(humanPlayer.hand.length - 1) * cardSpacing / 2;
    
    humanPlayer.hand.forEach((card, index) => {
      const x = startX + index * cardSpacing;
      const suitKey = card.isJoker ? 'joker' : card.suit;
      
      const cardSprite = this.add.image(x, 0, `card-${suitKey}`)
        .setInteractive({ useHandCursor: true });
        
      // Add card rank text
      this.add.text(x, 0, card.shortName, {
        fontSize: '16px',
        color: '#000000',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.cardSprites.push(cardSprite);
      this.handContainer.add(cardSprite);
    });
  }

  private onGameStarted(): void {
    this.statusText.setText('Game Started - Dealing Cards...');
    this.updateHand();
    this.updateScores();
  }

  private onBiddingStarted(): void {
    this.statusText.setText('Bidding Phase - Place your bids!');
    this.highlightCurrentPlayer();
    
    // If it's human player's turn, show bidding UI
    const gameState = this.gameManager.getGameState();
    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];
    
    if (currentPlayer.isHuman) {
      this.showBiddingUI();
    }
  }

  private onBidPlaced(bid: Bid): void {
    const player = this.gameManager.getPlayer(bid.playerId);
    if (bid.passed) {
      this.statusText.setText(`${player?.name} passed`);
    } else {
      this.statusText.setText(`${player?.name} bid ${bid.amount}`);
    }
    
    this.highlightCurrentPlayer();
    
    // Check if next player is human
    const gameState = this.gameManager.getGameState();
    if (gameState.gamePhase === 'bidding') {
      const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];
      if (currentPlayer.isHuman) {
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
  }

  private onPlayStarted(): void {
    this.statusText.setText('Play Phase - Playing cards...');
    this.highlightCurrentPlayer();
  }

  private highlightCurrentPlayer(): void {
    const gameState = this.gameManager.getGameState();
    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];
    
    // Reset all player text styles
    Object.values(this.playerTexts).forEach(text => {
      text.setStyle({ backgroundColor: '#444444' });
    });
    
    // Highlight current player
    if (this.playerTexts[currentPlayer.id]) {
      this.playerTexts[currentPlayer.id].setStyle({ backgroundColor: '#6a4c93' });
    }
  }

  private updateScores(): void {
    const gameState = this.gameManager.getGameState();
    
    gameState.partnerships.forEach(partnership => {
      if (this.scoreTexts[partnership.id]) {
        const label = partnership.id === 'ns_partnership' ? 'N/S' : 'E/W';
        this.scoreTexts[partnership.id].setText(`${label}: ${partnership.score}`);
      }
    });
  }

  private showBiddingUI(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create bidding buttons
    const buttonY = height - 250;
    const buttons: Phaser.GameObjects.Text[] = [];
    
    // Pass button
    const passButton = this.add.text(width / 2 - 150, buttonY, 'PASS', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#666666',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);
    
    passButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.gameManager.placeBid(this.getHumanPlayer()?.id || '', null);
        this.clearBiddingUI(buttons);
      });
    
    buttons.push(passButton);
    
    // Bid buttons (2-6)
    for (let bid = 2; bid <= 6; bid++) {
      const x = width / 2 - 50 + (bid - 2) * 30;
      const bidButton = this.add.text(x, buttonY, bid.toString(), {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#4a7c59',
        padding: { x: 12, y: 8 }
      }).setOrigin(0.5);
      
      bidButton.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.gameManager.placeBid(this.getHumanPlayer()?.id || '', bid);
          this.clearBiddingUI(buttons);
        });
      
      buttons.push(bidButton);
    }
  }

  private clearBiddingUI(buttons: Phaser.GameObjects.Text[]): void {
    buttons.forEach(button => button.destroy());
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

  private getHumanPlayer(): Player | undefined {
    const gameState = this.gameManager.getGameState();
    return gameState.players.find(p => p.isHuman);
  }
}