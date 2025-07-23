# SB-012: Smart Card Play AI Strategy

**Epic:** AI Intelligence
**Priority:** Medium
**Story Points:** 8
**Dependencies:** SB-002 (Trick-Taking Logic), SB-011 (Advanced Bidding AI)

## User Story

AS A player competing against AI opponents
I WANT the AI to play cards strategically during trick-taking
SO THAT the game provides realistic competition and educational value

## Acceptance Criteria

- [ ] AI chooses cards based on trick-taking strategy and hand analysis
- [ ] AI understands when to win tricks vs when to lose them
- [ ] AI considers partnership coordination in card selection
- [ ] AI adapts strategy based on trump suit and point cards
- [ ] AI shows different play styles (aggressive vs conservative)
- [ ] AI makes contextually appropriate decisions (leading vs following)
- [ ] AI avoids obviously bad plays that human wouldn't make
- [ ] AI card play contributes to achieving partnership's bid

## Technical Details

### Card Play Decision Framework

```typescript
interface PlayContext {
  position: TrickPosition;        // Leading, following, etc.
  tricksNeeded: number;          // How many tricks partnership needs
  pointsAtRisk: number;          // Scoring points in current trick
  partnerStatus: PartnerStatus;   // What partner has played/signaled
  opponentThreats: ThreatLevel;   // How dangerous opponents are
  handRemaining: Card[];         // Cards still in AI's hand
}

enum TrickPosition {
  LEADING = 'leading',           // First to play
  FOLLOWING_EARLY = 'early',     // Second player
  FOLLOWING_LATE = 'late',       // Third player
  FOLLOWING_LAST = 'last'        // Fourth player (most info)
}
```

### Strategic Card Selection

1. **Leading Strategy**

   ```typescript
   private selectLeadCard(context: PlayContext): Card {
     // Priority order for leading:
     // 1. Lead strong suit to set up tricks
     // 2. Lead trump if need to draw trump
     // 3. Lead point cards to force high cards
     // 4. Lead safe cards if protecting lead

     if (this.shouldLeadTrump(context)) {
       return this.selectBestTrumpLead(context);
     }

     if (this.shouldLeadPoints(context)) {
       return this.selectPointCardLead(context);
     }

     return this.selectSafeLead(context);
   }
   ```

2. **Following Strategy**

   ```typescript
   private selectFollowCard(trick: Trick, context: PlayContext): Card {
     const playableCards = this.getPlayableCards(trick.leadSuit);

     if (this.partnerWinning(trick)) {
       return this.selectLowCard(playableCards); // Don't overpower partner
     }

     if (this.canWinTrick(trick, playableCards)) {
       if (this.shouldWinTrick(context)) {
         return this.selectWinningCard(trick, playableCards);
       }
     }

     return this.selectSafeCard(playableCards, context);
   }
   ```

3. **Trump Management**

   ```typescript
   class TrumpStrategy {
     shouldPlayTrump(context: PlayContext): boolean {
       // Consider trump conservation vs trick necessity
       const trumpRemaining = this.countTrump(context.handRemaining);
       const tricksStillNeeded = context.tricksNeeded;

       // Play trump if necessary to make bid
       if (tricksStillNeeded > this.estimateNonTrumpTricks()) {
         return true;
       }

       // Hold trump if opponents likely have higher trump
       if (this.opponentsLikelyHaveHigherTrump()) {
         return false;
       }

       return this.evaluateTrumpTiming(context);
     }
   }
   ```

### Partnership Coordination

1. **Partner Communication (through play)**

   ```typescript
   interface PartnerSignaling {
     highCardLead: boolean;        // Leading high = ask for help
     lowCardFollow: boolean;       // Following low = no help needed
     trumpPlay: boolean;           // Trump = taking control
     pointCardProtection: boolean; // Covering partner's point cards
   }
   ```

2. **Coordinated Strategy**

   ```typescript
   private adjustForPartnerPlay(baseStrategy: CardChoice, partner: PartnerStatus): CardChoice {
     if (partner.hasBid && this.isPartnerInTrouble()) {
       // Help partner make their bid
       return this.selectSupportiveCard(baseStrategy);
     }

     if (partner.isWinning && this.tricksAreAbundant()) {
       // Don't interfere with partner's winning trick
       return this.selectNonCompetitiveCard(baseStrategy);
     }

     return baseStrategy;
   }
   ```

### Advanced Play Concepts

1. **Trick Value Assessment**

   ```typescript
   private assessTrickValue(trick: Trick): TrickValue {
     let value = 0;

     // Count point cards in trick
     trick.cards.forEach(playedCard => {
       value += playedCard.card.pointValue;
     });

     // Special scoring considerations
     if (this.containsScoringCards(trick)) {
       value += this.scoringCardBonus(trick);
     }

     return {
       pointValue: value,
       strategicImportance: this.assessStrategicValue(trick),
       mustWin: value > 0 && this.partnershipNeedsPoints(),
       canAffordToLose: this.estimateRemainingTricks() > this.tricksNeeded
     };
   }
   ```

2. **Endgame Strategy**

   ```typescript
   private adjustForEndgame(context: PlayContext): void {
     const tricksRemaining = 6 - context.currentTrick;

     if (tricksRemaining <= 2) {
       // Endgame: maximize known outcomes
       this.strategy = 'maximize_certain_tricks';
     } else if (tricksRemaining <= 4) {
       // Late game: control trump and point cards
       this.strategy = 'control_game_points';
     }
   }
   ```

### AI Difficulty Levels

```typescript
enum AIDifficulty {
  BEGINNER = 'beginner',    // Basic rule following, some mistakes
  INTERMEDIATE = 'intermediate', // Good tactics, occasional suboptimal plays
  ADVANCED = 'advanced',    // Strong strategic play, rare mistakes
  EXPERT = 'expert'        // Near-optimal play with advanced concepts
}

interface AIPlayProfile {
  difficulty: AIDifficulty;
  mistakeRate: number;          // Probability of suboptimal choice
  lookaheadDepth: number;       // How many tricks to analyze ahead
  partnershipWeight: number;    // How much to consider partner needs
  riskTolerance: number;        // Willingness to take calculated risks
}
```

## Definition of Done

- [ ] AI makes strategically sound card play decisions
- [ ] Partnership coordination logic properly implemented
- [ ] Different difficulty levels provide appropriate challenge
- [ ] AI adapts strategy based on game situation and position
- [ ] Trump management strategy works effectively
- [ ] Card selection algorithm performs well under time constraints
- [ ] Comprehensive testing of AI decision-making scenarios
- [ ] AI play patterns feel natural and human-like

## Notes

- **Strategy foundation**: Build on hand evaluation from bidding AI
- **Performance target**: Card selection decision in < 1 second
- **Human-like play**: Avoid perfectly optimal play that feels robotic
- **Educational value**: AI should demonstrate good Setback strategy
- **Partnership dynamics**: AI should help partner achieve shared goals
- **Adaptability**: AI should adjust based on success/failure patterns
