import type { Card } from "@/entities/Card";
import { AIPersonality, type GameState, type HandEvaluation, HandStrength } from "@/types/game";
import { HandEvaluator } from "./HandEvaluator";

/**
 * BiddingAI - Core AI bidding decision engine for Setback
 *
 * This class makes intelligent bidding decisions based on hand evaluation,
 * positional factors, game state, and AI personality settings. It provides
 * the main interface for AI players to determine appropriate bid amounts.
 *
 * Key Responsibilities:
 * - Hand strength analysis and bid threshold calculation
 * - Positional bidding adjustments (dealer vs non-dealer)
 * - Game score considerations (aggressive when behind, conservative when ahead)
 * - AI personality-based behavior modifications
 * - Randomization to prevent predictable patterns
 */
export class BiddingAI {
  private handEvaluator: HandEvaluator;
  private performanceStats = {
    evaluationTime: 0,
    decisionTime: 0,
    calls: 0,
  };

  constructor() {
    this.handEvaluator = new HandEvaluator();
  }

  /**
   * Main AI bidding decision method
   * @param hand Player's cards
   * @param gameState Current game state
   * @param personality AI personality (defaults to BALANCED)
   * @returns Bid amount (2-6) or null to pass
   */
  public calculateBid(
    hand: Card[],
    gameState: GameState,
    personality: AIPersonality = AIPersonality.BALANCED
  ): number | null {
    const startTime = performance.now();
    const currentPlayer = gameState.players[gameState.currentHand.currentPlayerIndex];

    try {
      console.log(`\n🤖 AI Bidding Decision - ${currentPlayer.name} (${personality})`);
      console.log(`📋 Hand: ${hand.map((c) => c.toString()).join(", ")}`);

      // Evaluate hand strength
      const evaluation = this.handEvaluator.evaluateHand(hand);
      console.log(`📊 Hand Evaluation:`);
      console.log(`   Overall Strength: ${evaluation.overallStrength}/100`);
      console.log(`   Point Cards: ${evaluation.pointCards} points`);
      console.log(
        `   Special Cards: ${evaluation.specialCards.joker ? "Joker" : "No Joker"}, Jacks: [${evaluation.specialCards.jacks.join(", ")}]`
      );

      // Show trump strengths
      const trumpStrengths = Array.from(evaluation.trumpStrength.entries())
        .map(([suit, strength]) => `${suit}=${strength}`)
        .join(", ");
      console.log(`   Trump Strengths: ${trumpStrengths}`);

      // Get base bidding threshold based on hand strength
      let bidThreshold = this.getBaseBidThreshold(evaluation.overallStrength);
      console.log(
        `🎯 Base Threshold: ${(bidThreshold * 100).toFixed(1)}% (from hand strength ${evaluation.overallStrength})`
      );

      // Apply personality adjustments
      const originalThreshold = bidThreshold;
      bidThreshold = this.adjustForPersonality(bidThreshold, personality, evaluation);
      if (bidThreshold !== originalThreshold) {
        console.log(
          `🎭 Personality (${personality}): ${(originalThreshold * 100).toFixed(1)}% → ${(bidThreshold * 100).toFixed(1)}%`
        );
      }

      // Apply positional adjustments
      const beforePosition = bidThreshold;
      bidThreshold = this.adjustForPosition(bidThreshold, gameState);
      if (bidThreshold !== beforePosition) {
        const position = currentPlayer.isDealer ? "Dealer" : "Non-dealer";
        console.log(
          `🎲 Position (${position}): ${(beforePosition * 100).toFixed(1)}% → ${(bidThreshold * 100).toFixed(1)}%`
        );
      }

      // Apply game score adjustments
      const beforeScore = bidThreshold;
      bidThreshold = this.adjustForGameScore(bidThreshold, gameState);
      if (bidThreshold !== beforeScore) {
        const partnership = gameState.partnerships.find(
          (p) => p.player1Id === currentPlayer.id || p.player2Id === currentPlayer.id
        );
        const opponentPartnership = gameState.partnerships.find((p) => p.id !== partnership?.id);
        const ourScore = partnership?.score || 0;
        const opponentScore = opponentPartnership?.score || 0;
        console.log(
          `🏆 Score Adjustment (Us: ${ourScore}, Them: ${opponentScore}): ${(beforeScore * 100).toFixed(1)}% → ${(bidThreshold * 100).toFixed(1)}%`
        );
      }

      // Apply partnership coordination
      const beforePartnership = bidThreshold;
      bidThreshold = this.adjustForPartnership(bidThreshold, gameState);
      if (bidThreshold !== beforePartnership) {
        console.log(`🤝 Partnership: ${(beforePartnership * 100).toFixed(1)}% → ${(bidThreshold * 100).toFixed(1)}%`);
      }

      // Show current bid context
      const currentBid = gameState.currentHand.currentBid;
      if (currentBid) {
        console.log(`💰 Current Bid: ${currentBid.amount} by ${currentBid.playerId}`);
      } else {
        console.log(`💰 Current Bid: None (opening bid)`);
      }

      // Decide bid amount based on adjusted threshold
      const bidDecision = this.decideBidAmount(bidThreshold, gameState, evaluation);

      // Log final decision
      if (bidDecision === null) {
        console.log(`❌ DECISION: PASS (threshold ${(bidThreshold * 100).toFixed(1)}% too high)`);
      } else {
        console.log(`✅ DECISION: BID ${bidDecision} (threshold ${(bidThreshold * 100).toFixed(1)}% passed)`);
      }

      return bidDecision;
    } finally {
      // Track performance
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`⏱️  Decision Time: ${duration.toFixed(2)}ms\n`);
      this.updatePerformanceStats(duration);
    }
  }

  /**
   * Gets base bidding threshold from hand strength
   * @param handStrength Overall hand strength (0-100)
   * @returns Base bidding threshold
   */
  private getBaseBidThreshold(handStrength: number): number {
    if (handStrength >= HandStrength.VERY_STRONG) {
      return 0.2; // Very aggressive - bid with 20% confidence
    }
    if (handStrength >= HandStrength.STRONG) {
      return 0.4; // Aggressive - bid with 40% confidence
    }
    if (handStrength >= HandStrength.MEDIUM) {
      return 0.6; // Competitive - bid with 60% confidence
    }
    if (handStrength >= HandStrength.WEAK) {
      return 0.8; // Conservative - bid with 80% confidence
    }
    return 1.0; // Very weak - only bid if forced
  }

  /**
   * Adjusts bidding threshold based on AI personality
   * @param baseThreshold Base threshold to adjust
   * @param personality AI personality type
   * @param evaluation Hand evaluation data
   * @returns Adjusted threshold
   */
  private adjustForPersonality(baseThreshold: number, personality: AIPersonality, evaluation: HandEvaluation): number {
    let adjustment = 1.0;

    switch (personality) {
      case AIPersonality.CONSERVATIVE:
        adjustment = 1.3; // 30% more conservative
        break;
      case AIPersonality.AGGRESSIVE:
        adjustment = 0.7; // 30% more aggressive
        break;
      case AIPersonality.ADAPTIVE:
        // Adapt based on hand quality
        if (evaluation.overallStrength >= 70) {
          adjustment = 0.8; // More aggressive with strong hands
        } else if (evaluation.overallStrength <= 30) {
          adjustment = 1.2; // More conservative with weak hands
        }
        break;
      default:
        adjustment = 1.0; // No adjustment (BALANCED or any other)
        break;
    }

    // Add slight randomization to prevent predictability (±10%)
    const randomFactor = 0.9 + Math.random() * 0.2;
    adjustment *= randomFactor;

    return baseThreshold * adjustment;
  }

  /**
   * Adjusts bidding threshold based on player position
   * @param baseThreshold Base threshold to adjust
   * @param gameState Current game state
   * @returns Adjusted threshold
   */
  private adjustForPosition(baseThreshold: number, gameState: GameState): number {
    const currentPlayerIndex = gameState.currentHand.currentPlayerIndex;
    const currentPlayer = gameState.players[currentPlayerIndex];
    const currentBid = gameState.currentHand.currentBid;

    let adjustment = 1.0;

    // Dealer position adjustments
    if (currentPlayer.isDealer) {
      // Dealer is "stuck" if everyone passes - must bid at least 2
      const allOthersPassed = gameState.currentHand.bids
        .filter((bid) => bid.playerId !== currentPlayer.id)
        .every((bid) => bid.passed);

      if (allOthersPassed && !currentBid) {
        adjustment = 0.3; // Much more likely to bid when stuck
      } else {
        adjustment = 0.9; // Slightly more aggressive as dealer
      }
    }

    // Last to bid advantages
    const bidsPlaced = gameState.currentHand.bids.length;
    const totalPlayers = gameState.players.length;

    if (bidsPlaced === totalPlayers - 1) {
      // Last player to bid - can steal or pass
      if (currentBid && currentBid.amount < 6) {
        adjustment *= 0.9; // Slightly more likely to steal
      }
    }

    return baseThreshold * adjustment;
  }

  /**
   * Adjusts bidding threshold based on current game score
   * @param baseThreshold Base threshold to adjust
   * @param gameState Current game state
   * @returns Adjusted threshold
   */
  private adjustForGameScore(baseThreshold: number, gameState: GameState): number {
    const currentPlayerIndex = gameState.currentHand.currentPlayerIndex;
    const currentPlayer = gameState.players[currentPlayerIndex];

    // Find player's partnership
    const partnership = gameState.partnerships.find(
      (p) => p.player1Id === currentPlayer.id || p.player2Id === currentPlayer.id
    );

    if (!partnership) return baseThreshold;

    // Find opponent partnership
    const opponentPartnership = gameState.partnerships.find((p) => p.id !== partnership.id);
    if (!opponentPartnership) return baseThreshold;

    const ourScore = partnership.score;
    const opponentScore = opponentPartnership.score;
    const scoreDifference = ourScore - opponentScore;

    let adjustment = 1.0;

    // More aggressive when behind
    if (scoreDifference < -5) {
      adjustment = 0.7; // 30% more aggressive when significantly behind
    } else if (scoreDifference < -2) {
      adjustment = 0.85; // 15% more aggressive when behind
    }

    // More conservative when ahead and close to winning
    if (ourScore >= 18) {
      adjustment = 1.3; // 30% more conservative when close to winning
    } else if (ourScore >= 15 && scoreDifference > 3) {
      adjustment = 1.15; // 15% more conservative when ahead and near win
    }

    // Desperate measures when opponent is close to winning
    if (opponentScore >= 18) {
      adjustment = 0.5; // 50% more aggressive to prevent opponent win
    } else if (opponentScore >= 15) {
      adjustment = 0.75; // 25% more aggressive when opponent near win
    }

    return baseThreshold * adjustment;
  }

  /**
   * Adjusts bidding threshold based on partnership considerations
   * @param baseThreshold Base threshold to adjust
   * @param gameState Current game state
   * @returns Adjusted threshold
   */
  private adjustForPartnership(baseThreshold: number, gameState: GameState): number {
    const currentPlayerIndex = gameState.currentHand.currentPlayerIndex;
    const currentPlayer = gameState.players[currentPlayerIndex];

    // Find partner
    const partnership = gameState.partnerships.find(
      (p) => p.player1Id === currentPlayer.id || p.player2Id === currentPlayer.id
    );

    if (!partnership) return baseThreshold;

    const partnerId = partnership.player1Id === currentPlayer.id ? partnership.player2Id : partnership.player1Id;

    // Check if partner has already bid
    const partnerBid = gameState.currentHand.bids.find((bid) => bid.playerId === partnerId);

    let adjustment = 1.0;

    if (partnerBid) {
      if (!partnerBid.passed) {
        // Partner already bid - be more conservative to avoid overbidding
        adjustment = 1.2; // 20% more conservative
      } else {
        // Partner passed - might need to step up
        adjustment = 0.95; // 5% more aggressive
      }
    }

    // Check if partner is dealer (they'll be stuck if everyone passes)
    const partner = gameState.players.find((p) => p.id === partnerId);
    if (partner?.isDealer) {
      const nonPartnerBids = gameState.currentHand.bids.filter(
        (bid) => bid.playerId !== partnerId && bid.playerId !== currentPlayer.id
      );

      if (nonPartnerBids.every((bid) => bid.passed)) {
        // Partner will be stuck - might want to help by bidding
        adjustment = 0.9; // 10% more aggressive to help partner
      }
    }

    return baseThreshold * adjustment;
  }

  /**
   * Makes final bid decision based on adjusted threshold
   * @param threshold Final adjusted threshold
   * @param gameState Current game state
   * @param evaluation Hand evaluation
   * @returns Bid amount or null to pass
   */
  private decideBidAmount(threshold: number, gameState: GameState, evaluation: HandEvaluation): number | null {
    const currentBid = gameState.currentHand.currentBid;
    const minBid = currentBid ? currentBid.amount + 1 : 2;

    // If minimum bid would be higher than 6, cannot bid
    if (minBid > 6) {
      return null;
    }

    // If threshold is too high, pass
    if (threshold > 0.9) {
      return null;
    }

    // Calculate appropriate bid amount based on hand strength and threshold
    let bidAmount = this.calculateBidAmount(evaluation.overallStrength, threshold);

    // Ensure bid is legal
    bidAmount = Math.max(bidAmount, minBid);
    bidAmount = Math.min(bidAmount, 6);

    // Final check - if we're being forced to bid higher than we want, pass
    if (bidAmount > minBid + 1 && threshold > 0.7) {
      return null;
    }

    return bidAmount;
  }

  /**
   * Calculates specific bid amount based on hand strength and threshold
   * @param handStrength Overall hand strength (0-100)
   * @param threshold Adjusted bidding threshold
   * @returns Suggested bid amount (2-6)
   */
  private calculateBidAmount(handStrength: number, threshold: number): number {
    // Base bid calculation
    if (handStrength >= 85) return 6; // Shoot the moon
    if (handStrength >= 75) return 5; // Very strong
    if (handStrength >= 60) return 4; // Strong
    if (handStrength >= 45) return 3; // Medium-strong
    if (handStrength >= 30) return 2; // Minimum bid

    // Adjust for threshold - higher threshold means more conservative
    if (threshold > 0.8) return 2; // Conservative - minimum bid
    if (threshold < 0.4) {
      // Aggressive - bid one higher than base
      if (handStrength >= 70) return Math.min(6, 5);
      if (handStrength >= 55) return Math.min(6, 4);
      if (handStrength >= 40) return Math.min(6, 3);
    }

    return 2; // Default minimum bid
  }

  /**
   * Updates performance tracking statistics
   * @param duration Time taken for this decision (ms)
   */
  private updatePerformanceStats(duration: number): void {
    this.performanceStats.calls++;
    this.performanceStats.decisionTime += duration;
    this.performanceStats.evaluationTime = duration; // Most recent
  }

  /**
   * Gets current performance statistics
   * @returns Performance stats object
   */
  public getPerformanceStats() {
    return {
      ...this.performanceStats,
      averageDecisionTime:
        this.performanceStats.calls > 0 ? this.performanceStats.decisionTime / this.performanceStats.calls : 0,
    };
  }

  /**
   * Resets performance tracking statistics
   */
  public resetPerformanceStats(): void {
    this.performanceStats = {
      evaluationTime: 0,
      decisionTime: 0,
      calls: 0,
    };
  }
}
