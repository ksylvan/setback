import type { Player } from "@/types/game";
import type { TurnIndicationState } from "@/types/interaction";

/**
 * TurnIndicator - Enhanced turn display with visual effects
 *
 * Features:
 * - Clear player highlighting with glow effects
 * - Instruction text for current action
 * - Timer display for time-limited turns
 * - Accessibility announcements
 * - Smooth animations and transitions
 */
export class TurnIndicator extends Phaser.GameObjects.Container {
  private playerNameText!: Phaser.GameObjects.Text;
  private statusBackground!: Phaser.GameObjects.Rectangle;
  private glowEffect!: Phaser.GameObjects.Rectangle;
  private instructionText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private actionIcon!: Phaser.GameObjects.Text;

  // Visual constants
  private static readonly WIDTH = 300;
  private static readonly HEIGHT = 80;
  private static readonly PADDING = 16;
  private static readonly GLOW_SIZE = 6;

  // Animation tweens
  private glowTween?: Phaser.Tweens.Tween;
  private pulseTween?: Phaser.Tweens.Tween;

  // Current state
  private currentState: TurnIndicationState | null = null;
  private timerStartTime = 0;
  private timerDuration = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.createComponents();
    this.setVisible(false);

    scene.add.existing(this);
  }

  /**
   * Create visual components
   */
  private createComponents(): void {
    // Glow effect background (animated)
    this.glowEffect = this.scene.add.rectangle(
      0,
      0,
      TurnIndicator.WIDTH + TurnIndicator.GLOW_SIZE * 2,
      TurnIndicator.HEIGHT + TurnIndicator.GLOW_SIZE * 2,
      0xffd700,
      0
    );
    this.add(this.glowEffect);

    // Main background
    this.statusBackground = this.scene.add.rectangle(0, 0, TurnIndicator.WIDTH, TurnIndicator.HEIGHT, 0x2a2a2a, 0.95);
    this.statusBackground.setStrokeStyle(2, 0x555555);
    this.add(this.statusBackground);

    // Action icon (indicates what type of action is expected)
    this.actionIcon = this.scene.add.text(-TurnIndicator.WIDTH / 2 + 20, -15, "🎯", {
      fontSize: "24px",
    });
    this.add(this.actionIcon);

    // Player name text
    this.playerNameText = this.scene.add.text(0, -15, "", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#FFD700",
      align: "center",
    });
    this.playerNameText.setOrigin(0.5);
    this.add(this.playerNameText);

    // Timer text (top right)
    this.timerText = this.scene.add.text(TurnIndicator.WIDTH / 2 - 20, -15, "", {
      fontSize: "14px",
      color: "#FFA500",
      align: "right",
    });
    this.timerText.setOrigin(1, 0.5);
    this.add(this.timerText);

    // Instruction text
    this.instructionText = this.scene.add.text(0, 10, "", {
      fontSize: "14px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: TurnIndicator.WIDTH - TurnIndicator.PADDING * 2 },
    });
    this.instructionText.setOrigin(0.5);
    this.add(this.instructionText);
  }

  /**
   * Show turn indication for a specific player
   */
  public showPlayerTurn(player: Player, instruction: string, timeLimit?: number): void {
    this.currentState = {
      currentPlayerId: player.id,
      playerName: player.name,
      instruction,
      timeRemaining: timeLimit,
      canAct: player.isHuman,
    };

    this.updateDisplay();
    this.showWithAnimation();

    // Start timer if specified
    if (timeLimit) {
      this.startTimer(timeLimit);
    }

    // Set accessibility attributes
    this.setAccessibilityAttributes();

    // Emit event for external listeners
    this.emit("turnShown", {
      player,
      instruction,
      timeLimit,
    });
  }

  /**
   * Show waiting state
   */
  public showWaitingState(waitingFor: string): void {
    this.currentState = {
      currentPlayerId: "",
      playerName: "Game",
      instruction: waitingFor,
      canAct: false,
    };

    this.updateDisplay();
    this.showWithAnimation();

    // Clear any active timer
    this.stopTimer();

    this.emit("waitingShown", { waitingFor });
  }

  /**
   * Hide the turn indicator
   */
  public hide(): void {
    this.stopAnimations();
    this.stopTimer();

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 200,
      ease: "Power2.easeIn",
      onComplete: () => {
        this.setVisible(false);
        this.currentState = null;
      },
    });
  }

  /**
   * Update the display based on current state
   */
  private updateDisplay(): void {
    if (!this.currentState) return;

    const { playerName, instruction, canAct } = this.currentState;

    // Update player name
    this.playerNameText.setText(playerName);

    // Update instruction
    this.instructionText.setText(instruction);

    // Update colors and effects based on player type
    if (canAct) {
      // Human player - bright highlighting
      this.playerNameText.setColor("#FFD700");
      this.statusBackground.setFillStyle(0x4a7c59, 0.95);
      this.statusBackground.setStrokeStyle(2, 0x6a9c79);
      this.actionIcon.setText("👤");
      this.startGlowEffect();
    } else {
      // AI player or waiting - muted colors
      this.playerNameText.setColor("#CCCCCC");
      this.statusBackground.setFillStyle(0x3a3a3a, 0.95);
      this.statusBackground.setStrokeStyle(2, 0x555555);
      this.actionIcon.setText("🤖");
      this.stopGlowEffect();
    }

    // Update action icon based on instruction
    if (instruction.toLowerCase().includes("bid")) {
      this.actionIcon.setText("💰");
    } else if (instruction.toLowerCase().includes("play")) {
      this.actionIcon.setText("🃏");
    } else if (instruction.toLowerCase().includes("wait")) {
      this.actionIcon.setText("⏳");
    }
  }

  /**
   * Show with smooth animation
   */
  private showWithAnimation(): void {
    this.setVisible(true);
    this.setAlpha(0);
    this.setScale(0.8);

    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: "Back.easeOut",
    });
  }

  /**
   * Start the glow effect animation
   */
  private startGlowEffect(): void {
    this.stopGlowEffect();

    this.glowTween = this.scene.tweens.add({
      targets: this.glowEffect,
      alpha: { from: 0, to: 0.4 },
      duration: 1000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Add subtle pulse to the whole indicator
    this.pulseTween = this.scene.tweens.add({
      targets: this,
      scaleX: { from: 1, to: 1.02 },
      scaleY: { from: 1, to: 1.02 },
      duration: 2000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Stop the glow effect animation
   */
  private stopGlowEffect(): void {
    if (this.glowTween) {
      this.glowTween.remove();
      this.glowTween = undefined;
    }

    if (this.pulseTween) {
      this.pulseTween.remove();
      this.pulseTween = undefined;
    }

    this.glowEffect.setAlpha(0);
    this.setScale(1);
  }

  /**
   * Start countdown timer
   */
  private startTimer(duration: number): void {
    this.timerStartTime = Date.now();
    this.timerDuration = duration;

    // Update timer display every 100ms
    const timerEvent = this.scene.time.addEvent({
      delay: 100,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    // Store reference for cleanup
    this.setData("timerEvent", timerEvent);
  }

  /**
   * Update timer display
   */
  private updateTimer(): void {
    if (!this.currentState?.timeRemaining) return;

    const elapsed = Date.now() - this.timerStartTime;
    const remaining = Math.max(0, this.timerDuration - elapsed);
    const seconds = Math.ceil(remaining / 1000);

    this.timerText.setText(`${seconds}s`);

    // Change color as time runs out
    if (seconds <= 5) {
      this.timerText.setColor("#FF4444");
    } else if (seconds <= 10) {
      this.timerText.setColor("#FFA500");
    } else {
      this.timerText.setColor("#4CAF50");
    }

    // Emit warning events
    if (seconds === 10) {
      this.emit("timeWarning", { remaining: 10 });
    } else if (seconds === 5) {
      this.emit("timeCritical", { remaining: 5 });
    } else if (seconds === 0) {
      this.emit("timeExpired");
      this.stopTimer();
    }
  }

  /**
   * Stop the timer
   */
  private stopTimer(): void {
    const timerEvent = this.getData("timerEvent");
    if (timerEvent) {
      timerEvent.remove();
      this.setData("timerEvent", null);
    }

    this.timerText.setText("");
  }

  /**
   * Stop all animations
   */
  private stopAnimations(): void {
    this.stopGlowEffect();
    this.scene.tweens.killTweensOf(this);
  }

  /**
   * Set accessibility attributes
   */
  private setAccessibilityAttributes(): void {
    if (!this.currentState) return;

    const { playerName, instruction, canAct, timeRemaining } = this.currentState;

    let description = `Current turn: ${playerName}. ${instruction}`;

    if (timeRemaining) {
      description += ` Time limit: ${Math.ceil(timeRemaining / 1000)} seconds.`;
    }

    if (canAct) {
      description += " Your turn to act.";
    } else {
      description += " Waiting for other player.";
    }

    this.setData("aria-label", description);
    this.setData("role", "status");
    this.setData("aria-live", "polite");
  }

  /**
   * Get current turn state
   */
  public getCurrentState(): TurnIndicationState | null {
    return this.currentState ? { ...this.currentState } : null;
  }

  /**
   * Update instruction text only
   */
  public updateInstruction(instruction: string): void {
    if (this.currentState) {
      this.currentState.instruction = instruction;
      this.instructionText.setText(instruction);
      this.setAccessibilityAttributes();
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopAnimations();
    this.stopTimer();
    super.destroy();
  }
}
