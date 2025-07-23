import Phaser, { WEBGL } from "phaser";
import { BootScene } from "@/scenes/BootScene";
import { GameScene } from "@/scenes/GameScene";
import { MenuScene } from "@/scenes/MenuScene";

// Calculate device pixel ratio for crisp rendering on high-DPI displays
const devicePixelRatio = window.devicePixelRatio || 1;

// Responsive base dimensions based on screen size
const getBaseDimensions = () => {
  const screenWidth = window.innerWidth;
  const isTablet = screenWidth >= 768 && screenWidth <= 1366;
  const isMobile = screenWidth < 768;

  if (isMobile) {
    // Mobile: Use smaller base to make elements larger relative to screen
    return { width: 800, height: 600 };
  } else if (isTablet) {
    // Tablet (iPad Pro): Balanced dimensions for better scaling
    return { width: 1000, height: 700 };
  } else {
    // Desktop: Full dimensions
    return { width: 1200, height: 800 };
  }
};

const { width: baseWidth, height: baseHeight } = getBaseDimensions();

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: WEBGL, // Use WebGL for better performance with high-resolution textures
  width: baseWidth * devicePixelRatio,
  height: baseHeight * devicePixelRatio,
  parent: "game-container",
  backgroundColor: "#0f4c3a",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 1 / devicePixelRatio, // Scale back down to compensate for increased resolution
    min: {
      width: 600 * devicePixelRatio, // Reduced minimum for smaller screens
      height: 400 * devicePixelRatio,
    },
    max: {
      width: 1600 * devicePixelRatio,
      height: 1200 * devicePixelRatio,
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
    mipmapFilter: "LINEAR_MIPMAP_LINEAR", // Improves quality when scaling down
    roundPixels: false, // Allow sub-pixel positioning for smoother scaling
  },
  dom: {
    createContainer: true,
  },
};
