# SB-014: AI Difficulty Settings and Adaptive Intelligence

**Epic:** AI Intelligence
**Priority:** Low
**Story Points:** 3
**Dependencies:** SB-013 (AI Partnership Coordination)

## User Story

AS A player with varying skill levels
I WANT to choose AI difficulty settings that match my experience
SO THAT I can enjoy appropriate challenge and improve my Setback skills

## Acceptance Criteria

- [ ] Multiple AI difficulty levels available (Beginner, Intermediate, Advanced, Expert)
- [ ] Each difficulty level provides distinctly different challenge levels
- [ ] AI difficulty settings affect both bidding and card play intelligence
- [ ] Beginner AI makes relatable mistakes that humans might make
- [ ] Expert AI provides strong competition for experienced players
- [ ] Optional adaptive difficulty adjusts based on player performance
- [ ] Difficulty settings are persistent across game sessions
- [ ] Clear descriptions help players choose appropriate difficulty

## Technical Details

### Difficulty Level Specifications

```typescript
interface AIDifficultyConfig {
  level: DifficultyLevel;
  displayName: string;
  description: string;
  biddingIntelligence: BiddingAIConfig;
  playIntelligence: PlayAIConfig;
  partnershipCoordination: CoordinationConfig;
  mistakeRate: number;
  reactionTime: { min: number; max: number };
}

enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
  ADAPTIVE = 'adaptive'
}
```

### Difficulty Configurations

1. **Beginner AI**

   ```typescript
   const beginnerConfig: AIDifficultyConfig = {
     level: DifficultyLevel.BEGINNER,
     displayName: "Beginner",
     description: "Learning the game, makes occasional mistakes",
     biddingIntelligence: {
       handEvaluationAccuracy: 0.6,
       positionalAwareness: 0.3,
       riskTolerance: 0.7,
       mistakeTypes: ['overbidding', 'underbidding', 'poor_suit_evaluation']
     },
     playIntelligence: {
       strategicDepth: 1,  // Only looks ahead 1 trick
       partnershipWeight: 0.4,
       trumpConservation: 0.5,
       pointCardAwareness: 0.6
     },
     mistakeRate: 0.15,
     reactionTime: { min: 1500, max: 3000 }
   };
   ```

2. **Intermediate AI**

   ```typescript
   const intermediateConfig: AIDifficultyConfig = {
     level: DifficultyLevel.INTERMEDIATE,
     displayName: "Intermediate",
     description: "Solid play with good fundamentals",
     biddingIntelligence: {
       handEvaluationAccuracy: 0.8,
       positionalAwareness: 0.7,
       riskTolerance: 0.6,
       mistakeTypes: ['occasional_poor_timing', 'partnership_miscommunication']
     },
     playIntelligence: {
       strategicDepth: 2,
       partnershipWeight: 0.7,
       trumpConservation: 0.8,
       pointCardAwareness: 0.85
     },
     mistakeRate: 0.08,
     reactionTime: { min: 1000, max: 2000 }
   };
   ```

3. **Expert AI**

   ```typescript
   const expertConfig: AIDifficultyConfig = {
     level: DifficultyLevel.EXPERT,
     displayName: "Expert",
     description: "Tournament-level play with advanced strategy",
     biddingIntelligence: {
       handEvaluationAccuracy: 0.95,
       positionalAwareness: 0.95,
       riskTolerance: 0.5,
       mistakeTypes: ['rare_calculation_errors']
     },
     playIntelligence: {
       strategicDepth: 4,
       partnershipWeight: 0.9,
       trumpConservation: 0.95,
       pointCardAwareness: 0.98
     },
     mistakeRate: 0.02,
     reactionTime: { min: 500, max: 1500 }
   };
   ```

### Adaptive Difficulty System

```typescript
class AdaptiveDifficulty {
  private playerPerformance: PerformanceTracker;
  private currentDifficulty: DifficultyLevel;
  private adjustmentThreshold: number = 5; // games before adjustment

  adjustDifficulty(gameResults: GameResult[]): DifficultyLevel {
    const recentResults = gameResults.slice(-this.adjustmentThreshold);
    const winRate = this.calculateWinRate(recentResults);

    // Target 40-60% win rate for optimal challenge
    if (winRate > 0.7) {
      return this.increaseDifficulty();
    } else if (winRate < 0.3) {
      return this.decreaseDifficulty();
    }

    return this.currentDifficulty;
  }

  private calculatePerformanceMetrics(results: GameResult[]): PerformanceMetrics {
    return {
      winRate: this.calculateWinRate(results),
      averageScore: this.calculateAverageScore(results),
      biddingAccuracy: this.calculateBiddingAccuracy(results),
      improvementTrend: this.calculateTrend(results)
    };
  }
}
```

### Mistake Implementation

```typescript
interface AImistake {
  type: MistakeType;
  probability: number;
  context: GameContext;
  execute(normalAction: Action): Action;
}

enum MistakeType {
  OVERBID = 'overbid',              // Bid higher than hand warrants
  UNDERBID = 'underbid',            // Miss bidding opportunity
  POOR_TRUMP_TIMING = 'trump_timing', // Play trump at wrong time
  MISS_PARTNER_SIGNAL = 'signal',    // Don't recognize partner's play
  SUBOPTIMAL_LEAD = 'lead',         // Lead wrong card
  DEFENSIVE_ERROR = 'defense'        // Fail to prevent opponent success
}

class MistakeGenerator {
  generateMistake(config: AIDifficultyConfig, context: GameContext): AIAction {
    const mistakeRoll = Math.random();

    if (mistakeRoll < config.mistakeRate) {
      const mistakeType = this.selectMistakeType(config, context);
      return this.implementMistake(mistakeType, context);
    }

    return this.calculateOptimalAction(context);
  }
}
```

### Difficulty Selection UI

```typescript
interface DifficultySelectionData {
  levels: {
    level: DifficultyLevel;
    name: string;
    description: string;
    winRateEstimate: string;
    recommendedFor: string;
  }[];
  currentSelection: DifficultyLevel;
  adaptiveEnabled: boolean;
}

const difficultyDescriptions = {
  beginner: {
    description: "Perfect for learning Setback rules and basic strategy",
    winRateEstimate: "60-80% player wins",
    recommendedFor: "New players, casual games"
  },
  expert: {
    description: "Challenging play for experienced Setback players",
    winRateEstimate: "30-40% player wins",
    recommendedFor: "Tournament players, skill improvement"
  }
};
```

## Definition of Done

- [ ] All difficulty levels implemented with distinct characteristics
- [ ] Adaptive difficulty system adjusts appropriately to player performance
- [ ] Beginner AI makes realistic beginner mistakes
- [ ] Expert AI provides genuine challenge for skilled players
- [ ] Difficulty settings UI is clear and helpful
- [ ] Settings persist across game sessions
- [ ] Performance impact is minimal across all difficulty levels
- [ ] Comprehensive testing validates each difficulty level's behavior

## Notes

- **Accessibility focus**: Beginner level should be genuinely accessible to new players
- **Progression path**: Clear skill progression from Beginner → Expert
- **Mistake authenticity**: AI mistakes should feel human-like, not random
- **Adaptive sensitivity**: Avoid over-adjusting based on short-term results
- **Performance target**: All difficulty levels should respond within acceptable time limits
- **Future extension**: Foundation for tournament modes and skill ratings
