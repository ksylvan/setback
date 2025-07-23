# SB-015: AI Performance Optimization

**Epic:** AI Intelligence
**Priority:** Low
**Story Points:** 3
**Dependencies:** SB-014 (AI Difficulty Settings)

## User Story

AS A player using the game on various devices
I WANT the AI to respond quickly without impacting game performance
SO THAT the game remains smooth and responsive during play

## Acceptance Criteria

- [ ] AI decision-making completes within target time limits (< 2 seconds)
- [ ] AI processing does not cause frame rate drops or UI lag
- [ ] Memory usage remains stable during extended AI calculations
- [ ] AI performance scales appropriately across different difficulty levels
- [ ] Mobile devices maintain smooth gameplay with AI active
- [ ] AI calculations can be interrupted if needed (game state changes)
- [ ] Performance monitoring and debugging tools available
- [ ] AI optimization doesn't compromise decision quality significantly

## Technical Details

### Performance Targets

```typescript
interface AIPerformanceTargets {
  biddingDecision: number;    // < 1000ms
  cardPlayDecision: number;   // < 2000ms
  handEvaluation: number;     // < 500ms
  partnershipAnalysis: number; // < 300ms

  memoryUsage: {
    maxHeapSize: number;      // < 10MB per AI instance
    gcFrequency: number;      // No forced GC > 1/sec
  };

  frameImpact: {
    maxFrameDrop: number;     // < 5ms per AI decision
    targetFPS: number;        // Maintain 60fps during AI turns
  };
}
```

### Optimization Strategies

1. **Algorithm Optimization**

   ```typescript
   class OptimizedAI {
     // Cache expensive calculations
     private handEvaluationCache = new Map<string, HandEvaluation>();
     private cardAnalysisCache = new Map<string, CardAnalysis>();

     // Memoize repeated calculations
     @memoize
     private calculateTrumpStrength(suit: Suit, hand: Card[]): number {
       // Implementation cached for identical inputs
     }

     // Early termination for obvious decisions
     private quickDecisionCheck(context: GameContext): Action | null {
       if (this.hasObviousPlay(context)) {
         return this.getObviousPlay(context);
       }
       return null; // Proceed with full analysis
     }
   }
   ```

2. **Asynchronous Processing**

   ```typescript
   class AsyncAIManager {
     async makeDecision(context: GameContext): Promise<AIDecision> {
       // Use Web Workers for heavy calculations on supported browsers
       if (this.webWorkersAvailable) {
         return this.processInWorker(context);
       }

       // Break calculation into chunks with yielding
       return this.processWithYielding(context);
     }

     private async processWithYielding(context: GameContext): Promise<AIDecision> {
       const chunks = this.breakIntoChunks(context);
       let result = null;

       for (const chunk of chunks) {
         result = await this.processChunk(chunk, result);
         await this.yieldToMainThread(); // Allow UI updates
       }

       return result;
     }
   }
   ```

3. **Smart Caching Strategy**

   ```typescript
   interface CacheStrategy {
     handEvaluations: LRUCache<string, HandEvaluation>;
     gameStateAnalysis: LRUCache<string, StateAnalysis>;
     partnershipMemory: Map<string, PartnershipData>;

     getCacheKey(data: any): string;
     invalidateOnGameStateChange(): void;
     cleanupOldEntries(): void;
   }

   // Cache management
   private manageCaches(): void {
     // Limit cache sizes to prevent memory bloat
     this.handEvaluationCache.max = 100;
     this.cardAnalysisCache.max = 200;

     // Clear caches between games
     this.gameManager.on('gameStarted', () => this.clearGameCaches());
   }
   ```

### Progressive Complexity

```typescript
class ProgressiveAI {
  private readonly timeLimit: number;
  private startTime: number;

  makeDecision(context: GameContext): AIDecision {
    this.startTime = performance.now();

    // Level 1: Basic rule-following (always completes quickly)
    let decision = this.basicDecision(context);

    if (this.hasTimeRemaining(0.3)) {
      // Level 2: Tactical analysis
      decision = this.improveWithTactics(decision, context);
    }

    if (this.hasTimeRemaining(0.6)) {
      // Level 3: Strategic planning
      decision = this.improveWithStrategy(decision, context);
    }

    if (this.hasTimeRemaining(0.8)) {
      // Level 4: Partnership coordination
      decision = this.improveWithPartnership(decision, context);
    }

    return decision;
  }

  private hasTimeRemaining(threshold: number): boolean {
    const elapsed = performance.now() - this.startTime;
    return elapsed < (this.timeLimit * threshold);
  }
}
```

### Mobile-Specific Optimizations

```typescript
class MobileAIOptimizer {
  private readonly isMobile: boolean;
  private deviceCapability: DeviceCapability;

  optimizeForDevice(): AIConfig {
    if (this.isMobile) {
      return {
        // Reduce lookahead depth on mobile
        strategicDepth: Math.max(1, this.deviceCapability.aiDepth - 1),

        // Simplify calculations
        useSimplifiedEvaluation: true,

        // More aggressive caching
        cacheAggressively: true,

        // Faster timeout
        decisionTimeout: 1500, // vs 2000 on desktop

        // Skip some optimizations
        skipExpensiveOptimizations: true
      };
    }

    return this.getDesktopConfig();
  }
}
```

### Performance Monitoring

```typescript
interface AIPerformanceMetrics {
  averageDecisionTime: number;
  peakDecisionTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  frameDrops: number;
  timeoutOccurrences: number;
}

class PerformanceMonitor {
  private metrics: AIPerformanceMetrics;

  startDecisionTiming(): string {
    const id = this.generateId();
    this.timingMap.set(id, performance.now());
    return id;
  }

  endDecisionTiming(id: string): void {
    const elapsed = performance.now() - this.timingMap.get(id);
    this.updateMetrics(elapsed);
    this.timingMap.delete(id);
  }

  reportPerformanceIssues(): PerformanceReport {
    return {
      needsOptimization: this.metrics.averageDecisionTime > 1500,
      memoryPressure: this.metrics.memoryUsage > 8 * 1024 * 1024,
      frameImpact: this.metrics.frameDrops > 5,
      recommendations: this.generateRecommendations()
    };
  }
}
```

### Error Handling and Fallbacks

```typescript
class RobustAI {
  async makeDecisionWithFallback(context: GameContext): Promise<AIDecision> {
    try {
      // Try optimal AI decision
      return await this.makeOptimalDecision(context);
    } catch (error) {
      console.warn('AI optimization failed, falling back to basic AI:', error);

      // Fallback to simpler, guaranteed-fast decision
      return this.makeBasicDecision(context);
    }
  }

  private makeBasicDecision(context: GameContext): AIDecision {
    // Simple rule-based decision that always completes quickly
    // This ensures the game never hangs waiting for AI
    return this.ruleBasedDecision(context);
  }
}
```

## Definition of Done

- [ ] AI decision times consistently meet performance targets
- [ ] No noticeable UI lag or frame drops during AI turns
- [ ] Memory usage remains stable during extended gameplay
- [ ] Mobile performance meets acceptable standards
- [ ] Performance monitoring system implemented and functional
- [ ] Fallback systems prevent AI from blocking gameplay
- [ ] Optimization techniques maintain AI decision quality
- [ ] Comprehensive performance testing across target devices

## Notes

- **Performance budget**: AI should use < 10% of available frame time
- **Graceful degradation**: Reduce AI complexity before sacrificing responsiveness
- **User experience priority**: Smooth gameplay more important than perfect AI
- **Device testing**: Test on older mobile devices, not just latest hardware
- **Monitoring importance**: Performance metrics help identify optimization opportunities
- **Future scaling**: Architecture should support more sophisticated AI without performance cliff
