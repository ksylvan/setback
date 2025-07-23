import { Scene } from "phaser";

export class BootScene extends Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // Show loading progress
    this.createLoadingBar();

    // Load beautiful card sprites from Kenney's pack
    this.loadCardAssets();

    // Fallback: create simple colored rectangles if assets aren't available
    this.createFallbackCardTextures();
  }

  create(): void {
    console.log("🎴 BootScene created - loading complete");
    console.log("🎴 Total textures loaded:", Object.keys(this.textures.list).length);
    console.log("🎴 Sample card textures loaded:");
    console.log("🎴   card_hearts_A exists:", this.textures.exists("card_hearts_A"));
    console.log("🎴   card_clubs_02 exists:", this.textures.exists("card_clubs_02"));
    console.log("🎴   card_joker_red exists:", this.textures.exists("card_joker_red"));

    // Boot complete, go to menu
    this.scene.start("MenuScene");
  }

  private createLoadingBar(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(width / 2, height / 2, 400, 50, 0x222222);

    // Progress bar
    const progressBar = this.add.rectangle(width / 2, height / 2, 0, 30, 0x00ff00);

    // Loading text
    this.add
      .text(width / 2, height / 2 - 50, "Loading Setback...", {
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Update progress bar
    this.load.on("progress", (value: number) => {
      progressBar.width = 380 * value;
    });
  }

  private loadCardAssets(): void {
    console.log("🎴 BootScene: Loading card assets...");
    // Load Kenney's beautiful card sprites
    // Card backs for different themes
    this.load.image("card-back-blue", "assets/images/cards/card_back.png");
    this.load.image("card-back-red", "assets/images/cards/card_back.png");
    this.load.image("card-back-green", "assets/images/cards/card_back.png");
    this.load.image("cardBack_classic", "assets/images/cards/cardBack_classic.png");
    this.load.image("cardBack_vintage", "assets/images/cards/cardBack_vintage.png");
    this.load.image("cardBack_modern", "assets/images/cards/cardBack_modern.png");
    this.load.image("cardBack_neon", "assets/images/cards/cardBack_neon.png");
    this.load.image("cardBack_contrast", "assets/images/cards/cardBack_contrast.png");

    // Hearts (red) - Load test cards for quality comparison
    this.load.image("card_hearts_A", "assets/images/cards/card_hearts_A.png");
    this.load.image("card_hearts_02", "assets/images/cards/card_hearts_02.png");
    this.load.image("card_hearts_03", "assets/images/cards/card_hearts_03.png");

    this.load.image("card_hearts_04", "assets/images/cards/card_hearts_04.png");
    this.load.image("card_hearts_05", "assets/images/cards/card_hearts_05.png");
    this.load.image("card_hearts_06", "assets/images/cards/card_hearts_06.png");
    this.load.image("card_hearts_07", "assets/images/cards/card_hearts_07.png");
    this.load.image("card_hearts_08", "assets/images/cards/card_hearts_08.png");
    this.load.image("card_hearts_09", "assets/images/cards/card_hearts_09.png");
    this.load.image("card_hearts_10", "assets/images/cards/card_hearts_10.png");
    this.load.image("card_hearts_J", "assets/images/cards/card_hearts_J.png");
    this.load.image("card_hearts_Q", "assets/images/cards/card_hearts_Q.png");
    this.load.image("card_hearts_K", "assets/images/cards/card_hearts_K.png");

    // Diamonds (red)
    this.load.image("card_diamonds_A", "assets/images/cards/card_diamonds_A.png");
    this.load.image("card_diamonds_02", "assets/images/cards/card_diamonds_02.png");
    this.load.image("card_diamonds_03", "assets/images/cards/card_diamonds_03.png");
    this.load.image("card_diamonds_04", "assets/images/cards/card_diamonds_04.png");
    this.load.image("card_diamonds_05", "assets/images/cards/card_diamonds_05.png");
    this.load.image("card_diamonds_06", "assets/images/cards/card_diamonds_06.png");
    this.load.image("card_diamonds_07", "assets/images/cards/card_diamonds_07.png");
    this.load.image("card_diamonds_08", "assets/images/cards/card_diamonds_08.png");
    this.load.image("card_diamonds_09", "assets/images/cards/card_diamonds_09.png");
    this.load.image("card_diamonds_10", "assets/images/cards/card_diamonds_10.png");
    this.load.image("card_diamonds_J", "assets/images/cards/card_diamonds_J.png");
    this.load.image("card_diamonds_Q", "assets/images/cards/card_diamonds_Q.png");
    this.load.image("card_diamonds_K", "assets/images/cards/card_diamonds_K.png");

    // Clubs (black)
    this.load.image("card_clubs_A", "assets/images/cards/card_clubs_A.png");
    this.load.image("card_clubs_02", "assets/images/cards/card_clubs_02.png");
    this.load.image("card_clubs_03", "assets/images/cards/card_clubs_03.png");
    this.load.image("card_clubs_04", "assets/images/cards/card_clubs_04.png");
    this.load.image("card_clubs_05", "assets/images/cards/card_clubs_05.png");
    this.load.image("card_clubs_06", "assets/images/cards/card_clubs_06.png");
    this.load.image("card_clubs_07", "assets/images/cards/card_clubs_07.png");
    this.load.image("card_clubs_08", "assets/images/cards/card_clubs_08.png");
    this.load.image("card_clubs_09", "assets/images/cards/card_clubs_09.png");
    this.load.image("card_clubs_10", "assets/images/cards/card_clubs_10.png");
    this.load.image("card_clubs_J", "assets/images/cards/card_clubs_J.png");
    this.load.image("card_clubs_Q", "assets/images/cards/card_clubs_Q.png");
    this.load.image("card_clubs_K", "assets/images/cards/card_clubs_K.png");

    // Spades (black)
    this.load.image("card_spades_A", "assets/images/cards/card_spades_A.png");
    this.load.image("card_spades_02", "assets/images/cards/card_spades_02.png");
    this.load.image("card_spades_03", "assets/images/cards/card_spades_03.png");
    this.load.image("card_spades_04", "assets/images/cards/card_spades_04.png");
    this.load.image("card_spades_05", "assets/images/cards/card_spades_05.png");
    this.load.image("card_spades_06", "assets/images/cards/card_spades_06.png");
    this.load.image("card_spades_07", "assets/images/cards/card_spades_07.png");
    this.load.image("card_spades_08", "assets/images/cards/card_spades_08.png");
    this.load.image("card_spades_09", "assets/images/cards/card_spades_09.png");
    this.load.image("card_spades_10", "assets/images/cards/card_spades_10.png");
    this.load.image("card_spades_J", "assets/images/cards/card_spades_J.png");
    this.load.image("card_spades_Q", "assets/images/cards/card_spades_Q.png");
    this.load.image("card_spades_K", "assets/images/cards/card_spades_K.png");

    // Jokers
    this.load.image("card_joker_red", "assets/images/cards/card_joker_red.png");
    this.load.image("card_joker_black", "assets/images/cards/card_joker_black.png");

    console.log("🎴 BootScene: Finished setting up card asset loading");
  }

  private createFallbackCardTextures(): void {
    // Create simple colored rectangles for card backs and suits
    const cardWidth = 80;
    const cardHeight = 112;

    // Card back
    this.add
      .graphics()
      .fillStyle(0x1a1a7e)
      .fillRoundedRect(0, 0, cardWidth, cardHeight, 8)
      .generateTexture("card-back", cardWidth, cardHeight)
      .destroy();

    // Suit colors
    const suitColors = {
      hearts: 0xff0000,
      diamonds: 0xff0000,
      clubs: 0x000000,
      spades: 0x000000,
      joker: 0x7f7f7f,
    };

    // Create basic card faces for each suit
    Object.entries(suitColors).forEach(([suit, color]) => {
      this.add
        .graphics()
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
    this.add.graphics().fillStyle(0x0f4c3a).fillRect(0, 0, 32, 32).generateTexture("table-felt", 32, 32).destroy();
  }
}
