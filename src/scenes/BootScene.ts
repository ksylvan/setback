import { Scene } from 'phaser';

export class BootScene extends Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Show loading progress
    this.createLoadingBar();
    
    // Load essential assets
    // TODO: Load card sprites, UI elements, fonts, etc.
    
    // For now, create simple colored rectangles for cards
    this.createCardTextures();
  }

  create(): void {
    // Boot complete, go to menu
    this.scene.start('MenuScene');
  }

  private createLoadingBar(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Background
    this.add.rectangle(width / 2, height / 2, 400, 50, 0x222222);
    
    // Progress bar
    const progressBar = this.add.rectangle(width / 2, height / 2, 0, 30, 0x00ff00);
    
    // Loading text
    this.add.text(width / 2, height / 2 - 50, 'Loading Setback...', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Update progress bar
    this.load.on('progress', (value: number) => {
      progressBar.width = 380 * value;
    });
  }

  private createCardTextures(): void {
    // Create simple colored rectangles for card backs and suits
    const cardWidth = 80;
    const cardHeight = 112;
    
    // Card back
    this.add.graphics()
      .fillStyle(0x1a1a7e)
      .fillRoundedRect(0, 0, cardWidth, cardHeight, 8)
      .generateTexture('card-back', cardWidth, cardHeight)
      .destroy();
    
    // Suit colors
    const suitColors = {
      hearts: 0xff0000,
      diamonds: 0xff0000,
      clubs: 0x000000,
      spades: 0x000000,
      joker: 0x7f7f7f
    };
    
    // Create basic card faces for each suit
    Object.entries(suitColors).forEach(([suit, color]) => {
      this.add.graphics()
        .fillStyle(0xffffff)
        .fillRoundedRect(0, 0, cardWidth, cardHeight, 8)
        .lineStyle(2, 0x000000)
        .strokeRoundedRect(0, 0, cardWidth, cardHeight, 8)
        .fillStyle(color)
        .fillCircle(cardWidth / 2, cardHeight / 2, 20)
        .generateTexture(`card-${suit}`, cardWidth, cardHeight)
        .destroy();
    });
    
    // Create table texture
    this.add.graphics()
      .fillStyle(0x0f4c3a)
      .fillRect(0, 0, 32, 32)
      .generateTexture('table-felt', 32, 32)
      .destroy();
  }
}