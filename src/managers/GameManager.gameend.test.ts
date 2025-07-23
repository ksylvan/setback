import { beforeEach, describe, expect, it, vi } from "vitest";
import { GamePhase } from "@/types/game";
import { GameManager } from "./GameManager";

describe("GameManager - Game Completion (SB-005)", () => {
  let gameManager: GameManager;
  let mockEventEmitter: any;

  beforeEach(() => {
    const playerConfig = [
      { name: "Player 1", isHuman: true },
      { name: "AI Player 2", isHuman: false },
      { name: "AI Player 3", isHuman: false },
      { name: "AI Player 4", isHuman: false },
    ];
    gameManager = new GameManager({ targetScore: 21, players: playerConfig });

    // Mock event emissions to verify they're called
    mockEventEmitter = vi.spyOn(gameManager, "emit");
  });

  describe("Game Over Detection", () => {
    it("should correctly identify when game is over - single partnership reaches target", () => {
      const gameState = gameManager.getGameState();
      // Cast to any to allow modification for testing
      (gameState.partnerships[0] as any).score = 22; // NS partnership wins
      (gameState.partnerships[1] as any).score = 18; // EW partnership loses

      // Test isGameOver method
      expect(gameManager.isGameOver()).toBe(true);
      expect(gameState.partnerships[0].score).toBe(22);
      expect(gameState.partnerships[1].score).toBe(18);
    });

    it("should identify game over when multiple partnerships reach target", () => {
      const gameState = gameManager.getGameState();
      (gameState.partnerships[0] as any).score = 23; // NS partnership - higher score
      (gameState.partnerships[1] as any).score = 21; // EW partnership - target score

      // Test that game is over when multiple partnerships reach target
      expect(gameManager.isGameOver()).toBe(true);
      expect(gameState.partnerships[0].score).toBe(23);
      expect(gameState.partnerships[1].score).toBe(21);
    });

    it("should handle exact target score (21 points)", () => {
      const gameState = gameManager.getGameState();
      (gameState.partnerships[0] as any).score = 21; // Exactly at target
      (gameState.partnerships[1] as any).score = 18;

      expect(gameManager.isGameOver()).toBe(true);
      expect(gameState.partnerships[0].score).toBe(21);
      expect(gameState.partnerships[1].score).toBe(18);
    });

    it("should handle negative scores correctly", () => {
      const gameState = gameManager.getGameState();
      (gameState.partnerships[0] as any).score = -5; // Negative score (failed bids)
      (gameState.partnerships[1] as any).score = 22; // Above target

      expect(gameManager.isGameOver()).toBe(true);
      expect(gameState.partnerships[0].score).toBe(-5);
      expect(gameState.partnerships[1].score).toBe(22);
    });

    it("should not end game when no partnership reaches target", () => {
      const gameState = gameManager.getGameState();
      (gameState.partnerships[0] as any).score = 19;
      (gameState.partnerships[1] as any).score = 20;

      expect(gameManager.isGameOver()).toBe(false);
      expect(gameState.winner).toBeNull();
    });
  });

  describe("Game State Management", () => {
    it("should initialize with no winner", () => {
      const gameState = gameManager.getGameState();
      expect(gameState.winner).toBeNull();
      expect(gameState.gamePhase).toBe(GamePhase.SETUP);
    });

    it("should maintain partnership scores correctly", () => {
      const gameState = gameManager.getGameState();
      expect(gameState.partnerships).toHaveLength(2);
      expect(gameState.partnerships[0].score).toBe(0);
      expect(gameState.partnerships[1].score).toBe(0);
    });

    it("should preserve final scores after game completion", () => {
      const gameState = gameManager.getGameState();
      (gameState.partnerships[0] as any).score = 23;
      (gameState.partnerships[1] as any).score = 16;

      // Scores should be preserved
      expect(gameState.partnerships[0].score).toBe(23);
      expect(gameState.partnerships[1].score).toBe(16);
    });
  });

  describe("Event System Integration", () => {
    it("should have event emission capability", () => {
      // Verify that GameManager extends EventEmitter and can emit events
      expect(gameManager.emit).toBeDefined();
      expect(typeof gameManager.emit).toBe("function");
    });

    it("should track event emissions during test setup", () => {
      // Start a game to trigger some events
      gameManager.startGame();

      // Verify that events were emitted during game start
      expect(mockEventEmitter).toHaveBeenCalled();
    });
  });

  describe("Performance Requirements", () => {
    it("should complete game over detection efficiently", () => {
      const gameState = gameManager.getGameState();
      (gameState.partnerships[0] as any).score = 21;
      (gameState.partnerships[1] as any).score = 19;

      const startTime = performance.now();
      const isOver = gameManager.isGameOver();
      const endTime = performance.now();

      expect(isOver).toBe(true);
      expect(endTime - startTime).toBeLessThan(5); // Should complete under 5ms
    });

    it("should handle large score differences efficiently", () => {
      const gameState = gameManager.getGameState();
      (gameState.partnerships[0] as any).score = 100; // Very high score
      (gameState.partnerships[1] as any).score = 15;

      const startTime = performance.now();
      const isOver = gameManager.isGameOver();
      const endTime = performance.now();

      expect(isOver).toBe(true);
      expect(endTime - startTime).toBeLessThan(5);
    });
  });

  describe("Edge Cases", () => {
    it("should handle tie scenarios at target score", () => {
      const gameState = gameManager.getGameState();
      (gameState.partnerships[0] as any).score = 21;
      (gameState.partnerships[1] as any).score = 21; // Same score

      // Game should be over when both reach target
      expect(gameManager.isGameOver()).toBe(true);
    });

    it("should handle one partnership far above target", () => {
      const gameState = gameManager.getGameState();
      (gameState.partnerships[0] as any).score = 35; // Far above target
      (gameState.partnerships[1] as any).score = 18;

      expect(gameManager.isGameOver()).toBe(true);
      expect(gameState.partnerships[0].score).toBe(35);
    });

    it("should handle boundary conditions correctly", () => {
      const gameState = gameManager.getGameState();
      (gameState.partnerships[0] as any).score = 20; // Just below target
      (gameState.partnerships[1] as any).score = 19;

      expect(gameManager.isGameOver()).toBe(false);

      // Now reach exactly the target
      (gameState.partnerships[0] as any).score = 21;
      expect(gameManager.isGameOver()).toBe(true);
    });
  });
});
