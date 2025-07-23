# SB-013: AI Partnership Coordination

**Epic:** AI Intelligence
**Priority:** Medium
**Story Points:** 5
**Dependencies:** SB-012 (Smart Card Play AI)

## User Story

AS A player observing AI partnerships
I WANT to see AI partners coordinate effectively together
SO THAT the game demonstrates realistic partnership play dynamics

## Acceptance Criteria

- [ ] AI partners share information implicitly through their card play
- [ ] AI adjusts strategy when partner is the bidder vs when opponents bid
- [ ] AI partners avoid competing for the same tricks unnecessarily
- [ ] AI shows appropriate support when partner is in trouble
- [ ] AI partnership coordination affects both bidding and play decisions
- [ ] AI demonstrates understanding of partnership scoring dynamics
- [ ] Partnership AI behavior feels natural and collaborative
- [ ] AI partners complement each other's strengths and weaknesses

## Technical Details

### Partnership Communication Model

```typescript
interface PartnershipState {
  partnerIsDealer: boolean;
  partnerBid: Bid | null;
  partnerPosition: PlayerPosition;
  sharedGoals: {
    targetTricks: number;
    pointsNeeded: number;
    mustPreventOpponents: boolean;
  };
  implicitSignals: {
    partnerLeadPreference: Suit | null;
    partnerTrumpStrength: 'weak' | 'medium' | 'strong';
    partnerPointCardHoldings: PointCardEstimate;
  };
}
```

### Coordination Strategies

1. **Bidding Coordination**

   ```typescript
   private adjustBidForPartner(baseBid: number, partnershipState: PartnershipState): number {
     // If partner already bid, be more conservative
     if (partnershipState.partnerBid && !partnershipState.partnerBid.passed) {
       return this.increaseThreshold(baseBid, 0.3);
     }

     // If partner is dealer, consider they might get stuck
     if (partnershipState.partnerIsDealer && this.allOpponentsPassed()) {
       return this.supportPartnerBid(baseBid);
     }

     // Competitive bidding when both partnerships are strong
     if (this.detectBiddingWar()) {
       return this.coordinatedCompetitiveBid(baseBid, partnershipState);
     }

     return baseBid;
   }
   ```

2. **Play Coordination**

   ```typescript
   class PartnershipPlayStrategy {
     selectCard(availableCards: Card[], gameContext: GameContext): Card {
       const partnerStatus = this.analyzePartnerSituation(gameContext);

       if (partnerStatus.isBidder && partnerStatus.strugglingToMakeBid) {
         return this.selectSupportiveCard(availableCards, partnerStatus);
       }

       if (partnerStatus.isWinning && this.canAffordToUnderplay()) {
         return this.selectNonCompetitiveCard(availableCards);
       }

       if (partnerStatus.hasStrongSuit) {
         return this.avoidBlockingPartnersSuit(availableCards, partnerStatus.strongSuit);
       }

       return this.selectOptimalIndividualCard(availableCards);
     }
   }
   ```

### Implicit Communication Through Play

1. **Signaling System**

   ```typescript
   interface CardPlaySignals {
     leadHighCard: 'requesting_support' | 'showing_strength';
     leadLowCard: 'no_help_available' | 'partner_take_control';
     followHigh: 'competing_for_trick' | 'showing_strength';
     followLow: 'cant_help' | 'partner_has_it';
     trumpPlay: 'taking_control' | 'preventing_opponent';
   }
   ```

2. **Signal Interpretation**

   ```typescript
   private interpretPartnerSignal(partnerCard: Card, trickContext: TrickContext): PartnerIntent {
     if (partnerCard.rank >= Rank.KING && trickContext.position === 'leading') {
       return {
         intent: 'requesting_support',
         confidence: 0.8,
         suggestedResponse: 'play_high_if_possible'
       };
     }

     if (partnerCard.isTrump && trickContext.opponentsHavePointCards) {
       return {
         intent: 'protecting_points',
         confidence: 0.9,
         suggestedResponse: 'support_trump_or_underplay'
       };
     }

     return this.analyzeContextualSignal(partnerCard, trickContext);
   }
   ```

### Partnership Role Dynamics

1. **Bidder Support**

   ```typescript
   class BidderSupportStrategy {
     supportBiddingPartner(hand: Card[], partnerBid: Bid, gameState: GameState): Strategy {
       const tricksNeeded = partnerBid.amount;
       const estimatedPartnerTricks = this.estimatePartnerTricks(gameState);
       const myContribution = Math.max(0, tricksNeeded - estimatedPartnerTricks);

       return {
         prioritizeWinningTricks: myContribution > 0,
         conserveTrump: estimatedPartnerTricks >= tricksNeeded,
         protectPartnerLeads: true,
         avoidCompetition: this.abundantTricks(gameState)
       };
     }
   }
   ```

2. **Non-Bidder Strategy**

   ```typescript
   class NonBidderStrategy {
     playAsNonBidder(gameState: GameState): Strategy {
       return {
         maximizeActualPoints: true,
         conservativePlay: false,
         opportunisticTricks: true,
         preventOpponentBid: this.opponentsBidding(gameState)
       };
     }
   }
   ```

### Advanced Partnership Concepts

1. **Trick Distribution Planning**

   ```typescript
   interface TrickDistribution {
     partnerTricks: number;
     myTricks: number;
     uncertainTricks: number;

     planDistribution(bidAmount: number): {
       partnerTarget: number;
       myTarget: number;
       flexibleTricks: number;
     };
   }
   ```

2. **Endgame Coordination**

   ```typescript
   private coordinateEndgame(tricksRemaining: number, partnershipStatus: PartnershipStatus): EndgameStrategy {
     if (partnershipStatus.bidMadeOrFailed === 'uncertain') {
       return this.maximizeSuccessProbability();
     }

     if (partnershipStatus.bidMadeOrFailed === 'made') {
       return this.preventOverbidding();
     }

     // Bid failed - minimize damage
     return this.minimizePenalty();
   }
   ```

### Partnership Memory and Learning

```typescript
interface PartnershipMemory {
  partnerTendencies: {
    biddingStyle: 'conservative' | 'aggressive' | 'balanced';
    playStyle: 'supportive' | 'independent' | 'opportunistic';
    trumpUsage: 'conservative' | 'aggressive';
    signalRecognition: number; // How well partner reads signals
  };

  updatePartnerModel(gameResult: GameResult): void;
  predictPartnerAction(context: GameContext): ActionPrediction;
}
```

## Definition of Done

- [ ] AI partners demonstrate clear coordination in both bidding and play
- [ ] Implicit signaling system works effectively between AI partners
- [ ] Partnership strategy adjusts appropriately based on bidder/non-bidder roles
- [ ] AI shows realistic partnership dynamics (support, competition avoidance)
- [ ] Partnership coordination contributes to overall AI effectiveness
- [ ] Coordination behaviors feel natural to human observers
- [ ] Unit tests verify partnership coordination logic
- [ ] Integration tests confirm partnership AI works well together

## Notes

- **Subtlety important**: Coordination should be evident but not overpowered
- **Realism goal**: Mirror how experienced human partners coordinate
- **Balance**: AI should be good partners without being telepathic
- **Observability**: Human players should be able to learn partnership skills
- **Variability**: Different AI pairs should show different coordination styles
- **Foundation**: This builds on individual AI intelligence to create team play
