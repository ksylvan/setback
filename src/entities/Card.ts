import { ICard, Suit, Rank } from "@/types/game";

export class Card implements ICard {
  public suit: Suit | null;
  public rank: Rank;
  public id: string;
  public isJoker: boolean;

  constructor(suit: Suit | null, rank: Rank) {
    this.suit = suit;
    this.rank = rank;
    this.isJoker = rank === Rank.JOKER;
    this.id = this.isJoker ? "joker" : `${suit}_${rank}`;
  }

  /**
   * Get the display name of the card
   */
  get displayName(): string {
    if (this.isJoker) return "Joker";

    const rankName = this.getRankName();
    const suitName = this.getSuitName();
    return `${rankName} of ${suitName}`;
  }

  /**
   * Get the short name of the card (e.g., "AH", "JS", "Joker")
   */
  get shortName(): string {
    if (this.isJoker) return "Jo";

    const rankShort = this.getRankShort();
    const suitShort = this.getSuitShort();
    return `${rankShort}${suitShort}`;
  }

  /**
   * Get the point value for scoring (small points)
   */
  get pointValue(): number {
    switch (this.rank) {
      case Rank.JACK:
        return 1;
      case Rank.QUEEN:
        return 2;
      case Rank.KING:
        return 3;
      case Rank.ACE:
        return 4;
      case Rank.TEN:
        return 10;
      default:
        return 0;
    }
  }

  /**
   * Check if this card is trump based on the trump suit
   */
  isTrump(trumpSuit: Suit | null): boolean {
    if (!trumpSuit) return false;
    if (this.isJoker) return true; // Joker is always trump
    return this.suit === trumpSuit;
  }

  /**
   * Check if this card is the "off jack" (jack of same color as trump)
   */
  isOffJack(trumpSuit: Suit | null): boolean {
    if (!trumpSuit || this.isJoker || this.rank !== Rank.JACK) return false;
    if (this.suit === trumpSuit) return false; // This would be the jack of trump, not off jack

    return this.isSameColor(trumpSuit);
  }

  /**
   * Check if this card's suit is the same color as the given suit
   */
  isSameColor(suit: Suit): boolean {
    if (this.isJoker) return false;

    const redSuits = [Suit.HEARTS, Suit.DIAMONDS];
    const blackSuits = [Suit.CLUBS, Suit.SPADES];

    const thisIsRed = redSuits.includes(this.suit!);
    const otherIsRed = redSuits.includes(suit);

    return thisIsRed === otherIsRed;
  }

  /**
   * Compare this card to another for trump ordering
   * Returns: positive if this > other, negative if this < other, 0 if equal
   */
  compareForTrump(other: Card, trumpSuit: Suit | null): number {
    const thisIsTrump = this.isTrump(trumpSuit);
    const otherIsTrump = other.isTrump(trumpSuit);

    // Trump always beats non-trump
    if (thisIsTrump && !otherIsTrump) return 1;
    if (!thisIsTrump && otherIsTrump) return -1;

    // If both are trump or both are non-trump, compare by rank
    if (this.isJoker && !other.isJoker) return 1;
    if (!this.isJoker && other.isJoker) return -1;

    // Special case: joker counts as 10.5 of trump for trick-taking
    if (this.isJoker && other.isJoker) return 0;

    return this.rank - other.rank;
  }

  /**
   * Check if this card can follow the lead suit
   */
  canFollow(leadSuit: Suit, hand: Card[], trumpSuit: Suit | null): boolean {
    // Joker can always be played (it's always trump)
    if (this.isJoker) return true;

    // If this card matches the lead suit, it can always follow
    if (this.suit === leadSuit) return true;

    // Trump cards can always be played
    if (this.isTrump(trumpSuit)) return true;

    // Off-jack can always be played (it's considered trump)
    if (this.isOffJack(trumpSuit)) return true;

    // Check if player has any cards of the lead suit
    const hasLeadSuit = hand.some(
      (card) =>
        card.suit === leadSuit && !card.isJoker && !card.isOffJack(trumpSuit)
    );

    // If player has lead suit cards, this card can't follow unless it's also lead suit
    if (hasLeadSuit) return this.suit === leadSuit;

    // If player doesn't have lead suit, any card can follow
    return true;
  }

  private getRankName(): string {
    switch (this.rank) {
      case Rank.JACK:
        return "Jack";
      case Rank.QUEEN:
        return "Queen";
      case Rank.KING:
        return "King";
      case Rank.ACE:
        return "Ace";
      default:
        return this.rank.toString();
    }
  }

  private getSuitName(): string {
    switch (this.suit) {
      case Suit.HEARTS:
        return "Hearts";
      case Suit.DIAMONDS:
        return "Diamonds";
      case Suit.CLUBS:
        return "Clubs";
      case Suit.SPADES:
        return "Spades";
      default:
        return "Unknown";
    }
  }

  private getRankShort(): string {
    switch (this.rank) {
      case Rank.JACK:
        return "J";
      case Rank.QUEEN:
        return "Q";
      case Rank.KING:
        return "K";
      case Rank.ACE:
        return "A";
      default:
        return this.rank.toString();
    }
  }

  private getSuitShort(): string {
    switch (this.suit) {
      case Suit.HEARTS:
        return "H";
      case Suit.DIAMONDS:
        return "D";
      case Suit.CLUBS:
        return "C";
      case Suit.SPADES:
        return "S";
      default:
        return "?";
    }
  }
}
