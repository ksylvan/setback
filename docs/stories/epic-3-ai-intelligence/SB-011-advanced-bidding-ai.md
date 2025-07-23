# SB-011: Advanced Bidding AI Strategy

**Epic:** AI Intelligence
**Priority:** Medium
**Story Points:** 8
**Dependencies:** SB-001 (Card Playing Mechanics) - needs trump evaluation

## User Story

AS A player competing against AI opponents
I WANT the AI to make intelligent bidding decisions based on hand strength
SO THAT the game provides a challenging and realistic experience

## Acceptance Criteria

- [ ] AI evaluates hand strength accurately before bidding
- [ ] AI considers trump potential, point cards, and partnership position
- [ ] AI bidding behavior varies appropriately (conservative vs aggressive)
- [ ] AI understands positional bidding (dealer vs non-dealer strategies)
- [ ] AI makes reasonable bid amounts based on hand evaluation
- [ ] AI partnership coordination influences bidding decisions
- [ ] AI adapts bidding strategy based on current game score
- [ ] AI bidding feels natural and not predictable/robotic

## Technical Details

### Hand Evaluation Algorithm

```typescript
interface HandEvaluation {
  trumpStrength: Map<Suit, number>;     // Potential trump strength per suit
  pointCards: number;                   // High-value cards (J, Q, K, A, 10)
  specialCards: {
    joker: boolean;
    jacks: Suit[];                      // Jacks in hand
  };
  trickPotential: Map<Suit, number>;    // Estimated tricks per suit
  overallStrength: number;              // 0-100 hand strength score
}
```

### AI Bidding Strategy

1. **Hand Strength Categories**

   ```typescript
   enum HandStrength {
     VERY_WEAK = 0,      // < 20: Always pass unless dealer stuck
     WEAK = 20,          // 20-35: Only bid 2-3 if no competition
     MEDIUM = 35,        // 35-60: Competitive bidding 2-4
     STRONG = 60,        // 60-80: Aggressive bidding 3-5
     VERY_STRONG = 80    // 80+: Bid 4-6, consider shoot the moon
   }
   ```

2. **Trump Suit Evaluation**

   ```typescript
   private evaluateTrumpStrength(suit: Suit, hand: Card[]): number {
     let strength = 0;

     // Count trump cards in suit
     const trumpCards = hand.filter(card =>
       card.suit === suit || card.isJoker || card.isOffJack(suit)
     );

     // Evaluate trump quality
     strength += trumpCards.length * 10;           // Base trump count
     strength += this.countHighTrump(trumpCards);  // High trump bonus
     strength += this.hasJoker ? 15 : 0;          // Joker bonus
     strength += this.hasJackOfTrump ? 10 : 0;    // Jack bonus

     return Math.min(strength, 100);
   }
   ```

3. **Bidding Decision Logic**

   ```typescript
   class BiddingAI {
     calculateBid(hand: Card[], gameState: GameState): number | null {
       const evaluation = this.evaluateHand(hand);
       const position = this.getBiddingPosition(gameState);
       const currentBid = gameState.currentHand.currentBid;

       // Apply positional adjustments
       let bidThreshold = this.getBaseBidThreshold(evaluation.overallStrength);
       bidThreshold = this.adjustForPosition(bidThreshold, position);
       bidThreshold = this.adjustForGameScore(bidThreshold, gameState);
       bidThreshold = this.adjustForPartnership(bidThreshold, gameState);

       return this.decideBidAmount(bidThreshold, currentBid, evaluation);
     }
   }
   ```

### Advanced Bidding Factors

1. **Positional Awareness**

   ```typescript
   interface PositionalFactors {
     dealer: boolean;           // Stuck with 2 if everyone passes
     lastToBid: boolean;        // Can steal bid or pass
     partnerBid: Bid | null;    // Partner already committed
     opponentBids: Bid[];       // Competition level
   }
   ```

2. **Game Situation Adjustments**

   ```typescript
   private adjustForGameScore(baseThreshold: number, gameState: GameState): number {
     const ourScore = this.getPartnershipScore(gameState);
     const opponentScore = this.getOpponentScore(gameState);

     // More aggressive when behind
     if (ourScore < opponentScore - 5) return baseThreshold * 0.8;

     // More conservative when ahead and close to winning
     if (ourScore >= 18) return baseThreshold * 1.2;

     // Desperate measures when opponent near win
     if (opponentScore >= 18) return baseThreshold * 0.6;

     return baseThreshold;
   }
   ```

3. **Partnership Coordination**

   ```typescript
   private adjustForPartnership(baseThreshold: number, gameState: GameState): number {
     const partnerBid = this.getPartnerBid(gameState);

     if (partnerBid && !partnerBid.passed) {
       // Partner already bid - be more conservative
       return baseThreshold * 1.3;
     }

     if (this.isPartnerDealer(gameState)) {
       // Partner will get stuck if we pass
       return baseThreshold * 0.9;
     }

     return baseThreshold;
   }
   ```

### AI Personality Variations

```typescript
enum AIPersonality {
  CONSERVATIVE,    // Higher bid thresholds, risk-averse
  BALANCED,        // Standard bidding algorithm
  AGGRESSIVE,      // Lower thresholds, takes more risks
  ADAPTIVE         // Changes style based on game situation
}

interface AIBiddingProfile {
  personality: AIPersonality;
  riskTolerance: number;        // 0.5-1.5 multiplier
  aggressionLevel: number;      // 0.5-1.5 multiplier
  partnershipWeight: number;    // How much to consider partner
}
```

## Definition of Done

- [ ] Hand evaluation algorithm accurately assesses bidding potential
- [ ] AI makes contextually appropriate bidding decisions
- [ ] Positional and game situation factors properly implemented
- [ ] AI personality variations create diverse playing styles
- [ ] Partnership coordination logic influences AI decisions
- [ ] Bidding feels natural and challenging for human players
- [ ] Comprehensive unit tests for bidding scenarios
- [ ] Performance: bidding decision calculated in < 500ms

## Notes

- **Realism priority**: AI should make believable human-like decisions
- **Difficulty balance**: Challenging but not unbeatable
- **Hand evaluation**: Foundation for all other AI decision-making
- **Future extension**: This evaluation system will be reused for card play AI
- **Testing strategy**: Compare AI decisions against expert human play patterns
- **Avoid patterns**: Introduce randomness to prevent predictable play
