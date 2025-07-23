import { Game } from "phaser";
import { GameConfig } from "./game/GameConfig";

// Create and start the Phaser game
const game = new Game(GameConfig);

// Expose game instance for debugging
if (__DEV__) {
  (window as any).game = game;
}

export default game;
