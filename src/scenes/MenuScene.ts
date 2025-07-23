import { Scene } from "phaser";

export class MenuScene extends Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.tileSprite(0, 0, width, height, "table-felt").setOrigin(0);

    // Title
    this.add
      .text(width / 2, height * 0.2, "SETBACK", {
        fontSize: "64px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(width / 2, height * 0.3, "Card Game", {
        fontSize: "24px",
        color: "#cccccc",
      })
      .setOrigin(0.5);

    // Start button
    const startButton = this.add
      .text(width / 2, height * 0.5, "START GAME", {
        fontSize: "32px",
        color: "#ffffff",
        backgroundColor: "#4a7c59",
        padding: { x: 30, y: 15 },
      })
      .setOrigin(0.5);

    startButton
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.startGame();
      })
      .on("pointerover", () => {
        startButton.setStyle({ backgroundColor: "#5a8c69" });
      })
      .on("pointerout", () => {
        startButton.setStyle({ backgroundColor: "#4a7c59" });
      });

    // Instructions button
    const instructionsButton = this.add
      .text(width / 2, height * 0.6, "INSTRUCTIONS", {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#666666",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5);

    instructionsButton
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.showInstructions();
      })
      .on("pointerover", () => {
        instructionsButton.setStyle({ backgroundColor: "#777777" });
      })
      .on("pointerout", () => {
        instructionsButton.setStyle({ backgroundColor: "#666666" });
      });

    // Game info
    this.add
      .text(
        width / 2,
        height * 0.85,
        "A trick-taking card game for 4 players in partnerships\nFirst partnership to 21 points wins!",
        {
          fontSize: "16px",
          color: "#cccccc",
          align: "center",
        }
      )
      .setOrigin(0.5);
  }

  private startGame(): void {
    // Start the main game scene
    this.scene.start("GameScene", {
      players: [
        { name: "You", isHuman: true },
        { name: "West AI", isHuman: false },
        { name: "North AI", isHuman: false },
        { name: "East AI", isHuman: false },
      ],
    });
  }

  private showInstructions(): void {
    // TODO: Implement instructions overlay
    // For now, just show a simple alert-style text
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const instructionsText = `
SETBACK RULES

• 4 players in 2 partnerships (North/South vs East/West)
• Each player gets 6 cards from a 53-card deck (52 + joker)
• Bidding: Players bid 2-6 points their partnership will take
• Highest bidder chooses trump suit by leading first card
• Take tricks to score points:
  - High trump (1 pt)  - Low trump (1 pt)
  - Jack of trump (1 pt)  - Off jack (same color, 1 pt)
  - Joker (1 pt)  - Game/Small points majority (1 pt)

First partnership to 21 points wins!
    `;

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);

    const instructionsBox = this.add
      .text(width / 2, height / 2, instructionsText, {
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#333333",
        padding: { x: 30, y: 20 },
        align: "center",
      })
      .setOrigin(0.5);

    const closeButton = this.add
      .text(width / 2, height * 0.8, "CLOSE", {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#666666",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5);

    closeButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      overlay.destroy();
      instructionsBox.destroy();
      closeButton.destroy();
    });
  }
}
