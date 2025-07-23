import type { Card } from "@/entities/Card";
import { type HandEvaluation, Rank, Suit } from "@/types/game";

/**
 * HandEvaluator - Core AI hand strength analysis for Setback bidding decisions
 *
 * This class evaluates a player's hand strength across all potential trump suits,
 * counts point cards, identifies special cards (joker, jacks), and calculates
 * overall bidding potential on a 0-100 scale.
 *
 * Key Responsibilities:
 * - Trump strength evaluation for all 4 suits
 * - Point card identification and counting
 * - Special card bonus calculations (joker, off-jack)
 * - Overall hand strength scoring for bidding decisions
 */
export class HandEvaluator {
  /**
   * Evaluates a hand's bidding potential across all trump suit possibilities
   * @param hand Array of cards to evaluate
   * @returns Complete hand evaluation with strength metrics
   */
  public evaluateHand(hand: Card[]): HandEvaluation {
    const trumpStrength = new Map<Suit, number>();
    const trickPotential = new Map<Suit, number>();

    // Evaluate trump strength for each possible suit
    for (const suit of Object.values(Suit)) {
      const strength = this.evaluateTrumpStrength(suit, hand);
      trumpStrength.set(suit, strength);

      // Estimate trick-taking potential for this trump suit
      const tricks = this.estimateTrickPotential(suit, hand);
      trickPotential.set(suit, tricks);
    }

    // Count high-value point cards
    const pointCards = this.countPointCards(hand);

    // Identify special cards
    const specialCards = this.identifySpecialCards(hand);

    // Calculate overall hand strength (0-100 scale)
    const overallStrength = this.calculateOverallStrength(trumpStrength, pointCards, specialCards);

    return {
      trumpStrength,
      pointCards,
      specialCards,
      trickPotential,
      overallStrength,
    };
  }

  /**
   * Evaluates trump strength for a specific suit
   * @param suit The potential trump suit to evaluate
   * @param hand Player's cards
   * @returns Trump strength score (0-100)
   */
  private evaluateTrumpStrength(suit: Suit, hand: Card[]): number {
    let strength = 0;

    // Find all cards that would be trump in this suit
    const trumpCards = hand.filter((card) => card.suit === suit || card.isJoker || card.isOffJack(suit));

    // Base strength from trump card count (10 points per trump)
    strength += trumpCards.length * 10;

    // Bonus for high trump cards
    strength += this.calculateHighTrumpBonus(trumpCards, suit);

    // Special card bonuses
    const hasJoker = hand.some((card) => card.isJoker);
    const hasJackOfTrump = hand.some((card) => card.suit === suit && card.rank === Rank.JACK);
    const hasOffJack = hand.some((card) => card.isOffJack(suit));

    if (hasJoker) strength += 15; // Joker is always highest trump
    if (hasJackOfTrump) strength += 10; // Jack of trump is very strong
    if (hasOffJack) strength += 8; // Off-jack is also valuable

    // Cap at 100 to maintain consistent scale
    return Math.min(strength, 100);
  }

  /**
   * Calculates bonus points for high trump cards
   * @param trumpCards Array of trump cards for this suit
   * @param trumpSuit The trump suit being evaluated
   * @returns Bonus points for high trump quality
   */
  private calculateHighTrumpBonus(trumpCards: Card[], trumpSuit: Suit): number {
    let bonus = 0;

    for (const card of trumpCards) {
      if (card.isJoker) {
        bonus += 8; // Joker is highest trump
      } else if (card.rank === Rank.JACK && card.suit === trumpSuit) {
        bonus += 7; // Jack of trump
      } else if (card.isOffJack(trumpSuit)) {
        bonus += 6; // Off-jack
      } else if (card.rank === Rank.ACE) {
        bonus += 5; // Ace
      } else if (card.rank === Rank.KING) {
        bonus += 4; // King
      } else if (card.rank === Rank.QUEEN) {
        bonus += 3; // Queen
      } else if (card.rank === Rank.TEN) {
        bonus += 2; // Ten (valuable for points)
      }
    }

    return bonus;
  }

  /**
   * Estimates trick-taking potential for a trump suit
   * @param suit Potential trump suit
   * @param hand Player's cards
   * @returns Estimated number of tricks (0-6)
   */
  private estimateTrickPotential(suit: Suit, hand: Card[]): number {
    const trumpCards = hand.filter((card) => card.suit === suit || card.isJoker || card.isOffJack(suit));

    // Start with base trick estimate from trump count
    let tricks = Math.min(trumpCards.length * 0.6, 4); // Conservative estimate

    // Bonus for very high trump cards (likely to win tricks)
    const highTrump = trumpCards.filter(
      (card) =>
        card.isJoker || (card.rank === Rank.JACK && card.suit === suit) || card.isOffJack(suit) || card.rank >= Rank.ACE
    );
    tricks += highTrump.length * 0.3;

    // Add potential from non-trump aces (might win if not trumped)
    const nonTrumpAces = hand.filter((card) => card.rank === Rank.ACE && !card.isTrump(suit) && !card.isJoker);
    tricks += nonTrumpAces.length * 0.2;

    return Math.min(tricks, 6); // Cap at maximum possible tricks
  }

  /**
   * Counts high-value point cards for "Game" category scoring
   * @param hand Player's cards
   * @returns Total point card value
   */
  private countPointCards(hand: Card[]): number {
    return hand.reduce((total, card) => total + card.pointValue, 0);
  }

  /**
   * Identifies special cards in the hand
   * @param hand Player's cards
   * @returns Object with special card information
   */
  private identifySpecialCards(hand: Card[]): { joker: boolean; jacks: Suit[] } {
    const joker = hand.some((card) => card.isJoker);

    const jacks = hand
      .filter((card) => card.rank === Rank.JACK && !card.isJoker && card.suit !== null)
      .map((card) => card.suit as Suit);

    return { joker, jacks };
  }

  /**
   * Calculates overall hand strength score (0-100)
   * @param trumpStrength Map of trump strengths by suit
   * @param pointCards Total point card value
   * @param specialCards Special card information
   * @returns Overall strength score for bidding decisions
   */
  private calculateOverallStrength(
    trumpStrength: Map<Suit, number>,
    pointCards: number,
    specialCards: { joker: boolean; jacks: Suit[] }
  ): number {
    // Find the best trump suit strength
    const maxTrumpStrength = Math.max(...Array.from(trumpStrength.values()));

    // Base strength from best trump potential (60% weight)
    let strength = maxTrumpStrength * 0.6;

    // Point card contribution (25% weight)
    // Scale point cards to 0-100 (30 is maximum possible)
    const pointCardScore = Math.min((pointCards / 30) * 100, 100);
    strength += pointCardScore * 0.25;

    // Special card bonuses (15% weight)
    let specialBonus = 0;
    if (specialCards.joker) specialBonus += 20;
    specialBonus += specialCards.jacks.length * 8; // 8 points per jack
    strength += Math.min(specialBonus, 100) * 0.15;

    return Math.min(Math.round(strength), 100);
  }

  /**
   * Gets the best trump suit for this hand
   * @param hand Player's cards
   * @returns Best suit and its strength score
   */
  public getBestTrumpSuit(hand: Card[]): { suit: Suit; strength: number } {
    const evaluation = this.evaluateHand(hand);

    let bestSuit = Suit.HEARTS;
    let bestStrength = 0;

    for (const [suit, strength] of evaluation.trumpStrength) {
      if (strength > bestStrength) {
        bestSuit = suit;
        bestStrength = strength;
      }
    }

    return { suit: bestSuit, strength: bestStrength };
  }
}
