/**
 * TouchGestureManager - Advanced touch gesture handling for mobile devices
 *
 * Features:
 * - Swipe gesture detection with velocity and distance thresholds
 * - Double-tap recognition with timing validation
 * - Long press with customizable duration
 * - Touch pressure sensitivity (where supported)
 * - Gesture conflict prevention (zoom, scroll)
 * - Multi-touch handling
 */

export interface TouchGestureConfig {
  // Swipe detection
  swipeMinDistance: number;
  swipeMaxTime: number;
  swipeMinVelocity: number;

  // Double-tap detection
  doubleTapMaxDelay: number;
  doubleTapMaxDistance: number;

  // Long press detection
  longPressDelay: number;
  longPressMaxMovement: number;

  // Touch pressure (if supported)
  pressureSensitive: boolean;
  minimumPressure: number;
}

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
  pressure?: number;
}

export interface SwipeData {
  direction: "up" | "down" | "left" | "right";
  velocity: number;
  distance: number;
  startPoint: TouchPoint;
  endPoint: TouchPoint;
}

export interface DoubleTapData {
  x: number;
  y: number;
  timeBetweenTaps: number;
}

export interface LongPressData {
  x: number;
  y: number;
  duration: number;
  pressure?: number;
}

export class TouchGestureManager extends Phaser.Events.EventEmitter {
  private config: TouchGestureConfig;
  private lastTap?: TouchPoint;
  private longPressTimer?: Phaser.Time.TimerEvent;
  private scene: Phaser.Scene;
  private target: Phaser.GameObjects.GameObject;

  // Gesture state tracking
  private isLongPressing = false;
  private isSwipeInProgress = false;
  private touchStartPoint?: TouchPoint;

  constructor(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, config?: Partial<TouchGestureConfig>) {
    super();

    this.scene = scene;
    this.target = target;

    // Default configuration optimized for card game interactions
    this.config = {
      swipeMinDistance: 30,
      swipeMaxTime: 300,
      swipeMinVelocity: 0.1,
      doubleTapMaxDelay: 300,
      doubleTapMaxDistance: 20,
      longPressDelay: 600,
      longPressMaxMovement: 10,
      pressureSensitive: false,
      minimumPressure: 0.5,
      ...config,
    };

    this.setupEventListeners();
  }

  /**
   * Setup touch event listeners on the target
   */
  private setupEventListeners(): void {
    // Use Phaser's pointer events for consistent cross-platform behavior
    this.target.on("pointerdown", this.onTouchStart, this);
    this.target.on("pointermove", this.onTouchMove, this);
    this.target.on("pointerup", this.onTouchEnd, this);
    this.target.on("pointercancel", this.onTouchCancel, this);
  }

  /**
   * Handle touch start events
   */
  private onTouchStart(pointer: Phaser.Input.Pointer): void {
    const touchPoint: TouchPoint = {
      x: pointer.x,
      y: pointer.y,
      timestamp: Date.now(),
      pressure: this.getTouchPressure(pointer),
    };

    this.touchStartPoint = touchPoint;
    this.isSwipeInProgress = false;
    this.isLongPressing = false;

    // Start long press timer
    this.startLongPressTimer(touchPoint);

    // Check for double-tap
    this.checkDoubleTap(touchPoint);

    // Prevent default browser behaviors that might interfere
    this.preventGestureConflicts(pointer);
  }

  /**
   * Handle touch move events
   */
  private onTouchMove(pointer: Phaser.Input.Pointer): void {
    if (!this.touchStartPoint) return;

    const currentPoint: TouchPoint = {
      x: pointer.x,
      y: pointer.y,
      timestamp: Date.now(),
      pressure: this.getTouchPressure(pointer),
    };

    const distance = this.calculateDistance(this.touchStartPoint, currentPoint);

    // Cancel long press if moved too much
    if (distance > this.config.longPressMaxMovement) {
      this.cancelLongPress();
    }

    // Track potential swipe
    if (!this.isLongPressing && distance > this.config.swipeMinDistance / 2) {
      this.isSwipeInProgress = true;
    }
  }

  /**
   * Handle touch end events
   */
  private onTouchEnd(pointer: Phaser.Input.Pointer): void {
    if (!this.touchStartPoint) return;

    const touchEndPoint: TouchPoint = {
      x: pointer.x,
      y: pointer.y,
      timestamp: Date.now(),
      pressure: this.getTouchPressure(pointer),
    };

    // Cancel long press timer
    this.cancelLongPress();

    // Check for swipe gesture
    if (this.isSwipeInProgress) {
      this.detectSwipe(this.touchStartPoint, touchEndPoint);
    } else if (!this.isLongPressing) {
      // Regular tap (not part of long press or swipe)
      this.handleTap(touchEndPoint);
    }

    // Clean up touch state
    this.touchStartPoint = undefined;
    this.isSwipeInProgress = false;
  }

  /**
   * Handle touch cancel events
   */
  private onTouchCancel(): void {
    this.cancelLongPress();
    this.touchStartPoint = undefined;
    this.isSwipeInProgress = false;
    this.isLongPressing = false;
  }

  /**
   * Start long press detection timer
   */
  private startLongPressTimer(touchPoint: TouchPoint): void {
    this.cancelLongPress();

    this.longPressTimer = this.scene.time.delayedCall(this.config.longPressDelay, () => {
      this.isLongPressing = true;

      const longPressData: LongPressData = {
        x: touchPoint.x,
        y: touchPoint.y,
        duration: this.config.longPressDelay,
        pressure: touchPoint.pressure,
      };

      this.emit("longpress", longPressData);
    });
  }

  /**
   * Cancel long press timer
   */
  private cancelLongPress(): void {
    if (this.longPressTimer) {
      this.longPressTimer.remove();
      this.longPressTimer = undefined;
    }
  }

  /**
   * Detect swipe gestures
   */
  private detectSwipe(startPoint: TouchPoint, endPoint: TouchPoint): void {
    const distance = this.calculateDistance(startPoint, endPoint);
    const timeDiff = endPoint.timestamp - startPoint.timestamp;
    const velocity = distance / timeDiff;

    // Check if it meets swipe criteria
    if (
      distance < this.config.swipeMinDistance ||
      timeDiff > this.config.swipeMaxTime ||
      velocity < this.config.swipeMinVelocity
    ) {
      return;
    }

    const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;

    // Determine primary direction
    let direction: "up" | "down" | "left" | "right";
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? "right" : "left";
    } else {
      direction = deltaY > 0 ? "down" : "up";
    }

    const swipeData: SwipeData = {
      direction,
      velocity,
      distance,
      startPoint,
      endPoint,
    };

    this.emit("swipe", swipeData);
    this.emit(`swipe${direction}`, swipeData);
  }

  /**
   * Check for double-tap gesture
   */
  private checkDoubleTap(currentTap: TouchPoint): void {
    if (!this.lastTap) {
      this.lastTap = currentTap;
      return;
    }

    const timeDiff = currentTap.timestamp - this.lastTap.timestamp;
    const distance = this.calculateDistance(this.lastTap, currentTap);

    if (timeDiff <= this.config.doubleTapMaxDelay && distance <= this.config.doubleTapMaxDistance) {
      const doubleTapData: DoubleTapData = {
        x: currentTap.x,
        y: currentTap.y,
        timeBetweenTaps: timeDiff,
      };

      this.emit("doubletap", doubleTapData);
      this.lastTap = undefined; // Reset to prevent triple-tap
    } else {
      this.lastTap = currentTap;
    }
  }

  /**
   * Handle regular tap events
   */
  private handleTap(touchPoint: TouchPoint): void {
    this.emit("tap", touchPoint);
  }

  /**
   * Calculate distance between two touch points
   */
  private calculateDistance(point1: TouchPoint, point2: TouchPoint): number {
    const deltaX = point2.x - point1.x;
    const deltaY = point2.y - point1.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  /**
   * Get touch pressure if supported
   */
  private getTouchPressure(pointer: Phaser.Input.Pointer): number | undefined {
    if (!this.config.pressureSensitive) return undefined;

    // Access native pointer event for pressure data
    const nativeEvent = pointer.event as PointerEvent;
    return nativeEvent?.pressure;
  }

  /**
   * Prevent gesture conflicts like zoom and scroll
   */
  private preventGestureConflicts(pointer: Phaser.Input.Pointer): void {
    // Prevent context menu on long press
    if (pointer.event) {
      pointer.event.preventDefault();
    }

    // Prevent text selection
    if (this.scene.input.keyboard) {
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";
    }

    // Disable touch actions that might interfere
    const canvas = this.scene.game.canvas;
    if (canvas) {
      canvas.style.touchAction = "none";
    }
  }

  /**
   * Enable touch gesture detection
   */
  public enable(): void {
    this.setupEventListeners();
  }

  /**
   * Disable touch gesture detection
   */
  public disable(): void {
    this.target.off("pointerdown", this.onTouchStart, this);
    this.target.off("pointermove", this.onTouchMove, this);
    this.target.off("pointerup", this.onTouchEnd, this);
    this.target.off("pointercancel", this.onTouchCancel, this);
    this.cancelLongPress();
  }

  /**
   * Update gesture configuration
   */
  public updateConfig(newConfig: Partial<TouchGestureConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Check if device supports pressure-sensitive touch
   */
  public static supportsPressure(): boolean {
    return "PointerEvent" in window && "pressure" in PointerEvent.prototype;
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.disable();
    this.removeAllListeners();
    this.touchStartPoint = undefined;
    this.lastTap = undefined;
  }
}
