import Phaser, { AUTO } from "phaser";
import { BootScene } from "@/scenes/BootScene";
import { GameScene } from "@/scenes/GameScene";
import { MenuScene } from "@/scenes/MenuScene";

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 1200,
  height: 800,
  parent: "game-container",
  backgroundColor: "#0f4c3a",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 800,
      height: 600,
    },
    max: {
      width: 1600,
      height: 1200,
    },
  },
  scene: [BootScene, MenuScene, GameScene],
  physics: {
    default: "arcade",
    arcade: {
      debug: __DEV__,
      gravity: { x: 0, y: 0 },
    },
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  dom: {
    createContainer: true,
  },
};
