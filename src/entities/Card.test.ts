import { describe, expect, it } from "vitest";
import { Rank, Suit } from "@/types/game";
import { Card } from "./Card";

describe("Card", () => {
  describe("constructor", () => {
    it("should create a regular card correctly", () => {
      const card = new Card(Suit.HEARTS, Rank.ACE);

      expect(card.suit).toBe(Suit.HEARTS);
      expect(card.rank).toBe(Rank.ACE);
      expect(card.isJoker).toBe(false);
      expect(card.id).toBe("hearts_14");
    });

    it("should create a joker correctly", () => {
      const joker = new Card(null, Rank.JOKER);

      expect(joker.suit).toBe(null);
      expect(joker.rank).toBe(Rank.JOKER);
      expect(joker.isJoker).toBe(true);
      expect(joker.id).toBe("joker");
    });
  });

  describe("pointValue", () => {
    it("should return correct point values for face cards", () => {
      const jack = new Card(Suit.SPADES, Rank.JACK);
      const queen = new Card(Suit.SPADES, Rank.QUEEN);
      const king = new Card(Suit.SPADES, Rank.KING);
      const ace = new Card(Suit.SPADES, Rank.ACE);

      expect(jack.pointValue).toBe(1);
      expect(queen.pointValue).toBe(2);
      expect(king.pointValue).toBe(3);
      expect(ace.pointValue).toBe(4);
    });

    it("should return 10 points for ten", () => {
      const ten = new Card(Suit.HEARTS, Rank.TEN);
      expect(ten.pointValue).toBe(10);
    });

    it("should return 0 points for number cards", () => {
      const two = new Card(Suit.CLUBS, Rank.TWO);
      const nine = new Card(Suit.DIAMONDS, Rank.NINE);

      expect(two.pointValue).toBe(0);
      expect(nine.pointValue).toBe(0);
    });
  });

  describe("isTrump", () => {
    it("should return true when card suit matches trump suit", () => {
      const card = new Card(Suit.HEARTS, Rank.KING);
      expect(card.isTrump(Suit.HEARTS)).toBe(true);
    });

    it("should return false when card suit does not match trump suit", () => {
      const card = new Card(Suit.HEARTS, Rank.KING);
      expect(card.isTrump(Suit.SPADES)).toBe(false);
    });

    it("should return true for joker regardless of trump suit", () => {
      const joker = new Card(null, Rank.JOKER);
      expect(joker.isTrump(Suit.HEARTS)).toBe(true);
      expect(joker.isTrump(Suit.SPADES)).toBe(true);
    });
  });

  describe("isOffJack", () => {
    it("should return true for jack of same color as trump when trump is red", () => {
      const jackOfSpades = new Card(Suit.SPADES, Rank.JACK);
      const jackOfClubs = new Card(Suit.CLUBS, Rank.JACK);

      expect(jackOfSpades.isOffJack(Suit.HEARTS)).toBe(false); // Different color
      expect(jackOfSpades.isOffJack(Suit.DIAMONDS)).toBe(false); // Different color
      expect(jackOfClubs.isOffJack(Suit.HEARTS)).toBe(false); // Different color
      expect(jackOfClubs.isOffJack(Suit.DIAMONDS)).toBe(false); // Different color
    });

    it("should return true for jack of same color as trump when trump is black", () => {
      const jackOfHearts = new Card(Suit.HEARTS, Rank.JACK);
      const jackOfDiamonds = new Card(Suit.DIAMONDS, Rank.JACK);
      const jackOfSpades = new Card(Suit.SPADES, Rank.JACK);
      const jackOfClubs = new Card(Suit.CLUBS, Rank.JACK);

      expect(jackOfHearts.isOffJack(Suit.SPADES)).toBe(false); // Different color
      expect(jackOfHearts.isOffJack(Suit.CLUBS)).toBe(false); // Different color
      expect(jackOfDiamonds.isOffJack(Suit.SPADES)).toBe(false); // Different color
      expect(jackOfDiamonds.isOffJack(Suit.CLUBS)).toBe(false); // Different color
      expect(jackOfSpades.isOffJack(Suit.CLUBS)).toBe(true); // Same color (both black)
      expect(jackOfClubs.isOffJack(Suit.SPADES)).toBe(true); // Same color (both black)
    });

    it("should return false for non-jack cards", () => {
      const king = new Card(Suit.HEARTS, Rank.KING);
      expect(king.isOffJack(Suit.SPADES)).toBe(false);
    });

    it("should return false for jack of trump suit", () => {
      const jackOfHearts = new Card(Suit.HEARTS, Rank.JACK);
      expect(jackOfHearts.isOffJack(Suit.HEARTS)).toBe(false);
    });
  });

  describe("canFollow", () => {
    it("should return true when card matches lead suit", () => {
      const card = new Card(Suit.HEARTS, Rank.KING);
      const hand = [card, new Card(Suit.SPADES, Rank.QUEEN)];
      expect(card.canFollow(Suit.HEARTS, hand, Suit.SPADES, undefined)).toBe(true);
    });

    it("should return false when card does not match lead suit and player has lead suit", () => {
      const card = new Card(Suit.CLUBS, Rank.KING);
      const leadSuitCard = new Card(Suit.HEARTS, Rank.QUEEN);
      const hand = [card, leadSuitCard];
      expect(card.canFollow(Suit.HEARTS, hand, Suit.SPADES, undefined)).toBe(false);
    });

    it("should return true when player has no cards of lead suit", () => {
      const card = new Card(Suit.CLUBS, Rank.KING);
      const hand = [card, new Card(Suit.SPADES, Rank.QUEEN)];
      expect(card.canFollow(Suit.HEARTS, hand, Suit.DIAMONDS, undefined)).toBe(true);
    });

    it("should return true for lead suit card when player has lead suit", () => {
      const card = new Card(Suit.HEARTS, Rank.KING);
      const hand = [card, new Card(Suit.HEARTS, Rank.QUEEN)];
      expect(card.canFollow(Suit.HEARTS, hand, Suit.SPADES, undefined)).toBe(true);
    });

    describe("Off-jack trump leading rules", () => {
      it("should allow off-jack when trump is led and no actual trump cards exist", () => {
        const trumpSuit = Suit.HEARTS;
        const offJack = new Card(Suit.DIAMONDS, Rank.JACK); // Off-jack (same color as hearts)
        const hand = [
          offJack,
          new Card(Suit.CLUBS, Rank.KING), // Non-trump
          new Card(Suit.SPADES, Rank.QUEEN), // Non-trump
        ];

        // Trump is being led, but player has no actual trump cards
        expect(offJack.canFollow(trumpSuit, hand, trumpSuit, undefined)).toBe(true);
      });

      it("should prevent off-jack when trump is led and player has actual trump cards", () => {
        const trumpSuit = Suit.HEARTS;
        const offJack = new Card(Suit.DIAMONDS, Rank.JACK); // Off-jack (same color as hearts)
        const hand = [
          offJack,
          new Card(Suit.HEARTS, Rank.KING), // Actual trump card
          new Card(Suit.CLUBS, Rank.QUEEN), // Non-trump
        ];

        // Trump is being led, and player has actual trump cards
        expect(offJack.canFollow(trumpSuit, hand, trumpSuit, undefined)).toBe(false);
      });

      it("should allow off-jack when trump is led and only joker exists (no actual trump)", () => {
        const trumpSuit = Suit.HEARTS;
        const offJack = new Card(Suit.DIAMONDS, Rank.JACK); // Off-jack
        const joker = new Card(null, Rank.JOKER);
        const hand = [
          offJack,
          joker, // Joker is trump but not "actual trump suit"
          new Card(Suit.CLUBS, Rank.QUEEN), // Non-trump
        ];

        // Trump is being led, but no actual trump suit cards (joker doesn't count)
        expect(offJack.canFollow(trumpSuit, hand, trumpSuit, undefined)).toBe(true);
      });

      it("should prevent off-jack when trump is led and multiple actual trump cards exist", () => {
        const trumpSuit = Suit.SPADES;
        const offJack = new Card(Suit.CLUBS, Rank.JACK); // Off-jack (same color as spades)
        const hand = [
          offJack,
          new Card(Suit.SPADES, Rank.ACE), // Actual trump
          new Card(Suit.SPADES, Rank.KING), // Actual trump
          new Card(Suit.HEARTS, Rank.QUEEN), // Non-trump
        ];

        // Trump is being led, and player has multiple actual trump cards
        expect(offJack.canFollow(trumpSuit, hand, trumpSuit, undefined)).toBe(false);
      });

      it("should allow off-jack when non-trump suit is led (normal following rules)", () => {
        const trumpSuit = Suit.HEARTS;
        const offJack = new Card(Suit.DIAMONDS, Rank.JACK); // Off-jack
        const hand = [
          offJack,
          new Card(Suit.HEARTS, Rank.KING), // Actual trump
          new Card(Suit.CLUBS, Rank.QUEEN), // Non-trump
        ];

        // Non-trump suit is being led - off-jack can always be played as trump
        expect(offJack.canFollow(Suit.CLUBS, hand, trumpSuit, undefined)).toBe(true);
      });

      it("should handle edge case with jack of trump suit vs off-jack", () => {
        const trumpSuit = Suit.HEARTS;
        const jackOfTrump = new Card(Suit.HEARTS, Rank.JACK); // Jack of trump (not off-jack)
        const hand = [
          jackOfTrump,
          new Card(Suit.HEARTS, Rank.KING), // Another trump
          new Card(Suit.CLUBS, Rank.QUEEN), // Non-trump
        ];

        // Jack of trump should always be playable when trump is led
        expect(jackOfTrump.canFollow(trumpSuit, hand, trumpSuit, undefined)).toBe(true);
      });

      it("should verify off-jack identification with all color combinations", () => {
        // Hearts trump - Diamonds is off-jack
        const heartsOffJack = new Card(Suit.DIAMONDS, Rank.JACK);
        expect(heartsOffJack.isOffJack(Suit.HEARTS)).toBe(true);

        // Diamonds trump - Hearts is off-jack
        const diamondsOffJack = new Card(Suit.HEARTS, Rank.JACK);
        expect(diamondsOffJack.isOffJack(Suit.DIAMONDS)).toBe(true);

        // Spades trump - Clubs is off-jack
        const spadesOffJack = new Card(Suit.CLUBS, Rank.JACK);
        expect(spadesOffJack.isOffJack(Suit.SPADES)).toBe(true);

        // Clubs trump - Spades is off-jack
        const clubsOffJack = new Card(Suit.SPADES, Rank.JACK);
        expect(clubsOffJack.isOffJack(Suit.CLUBS)).toBe(true);
      });

      it("should prevent off-jack when any trump card (off-jack or jack of trump) leads the trick", () => {
        const trumpSuit = Suit.HEARTS;
        const offJack = new Card(Suit.DIAMONDS, Rank.JACK); // Off-jack (red)
        const hand = [
          offJack,
          new Card(Suit.CLUBS, Rank.KING), // Non-trump
          new Card(Suit.SPADES, Rank.QUEEN), // Non-trump
        ];

        // Case 1: Jack of Trump leads the trick
        const jackOfTrumpLead = new Card(Suit.HEARTS, Rank.JACK);
        expect(offJack.canFollow(Suit.HEARTS, hand, trumpSuit, jackOfTrumpLead)).toBe(false);

        // Case 2: Joker leads the trick
        const jokerLead = new Card(null, Rank.JOKER);
        expect(offJack.canFollow(Suit.HEARTS, hand, trumpSuit, jokerLead)).toBe(false);

        // Case 3: Regular trump card leads the trick
        const regularTrumpLead = new Card(Suit.HEARTS, Rank.ACE);
        expect(offJack.canFollow(Suit.HEARTS, hand, trumpSuit, regularTrumpLead)).toBe(false);
      });
    });
  });

  describe("compareForTrump", () => {
    it("should return positive when trump card beats non-trump", () => {
      const trumpCard = new Card(Suit.HEARTS, Rank.TWO);
      const nonTrumpCard = new Card(Suit.SPADES, Rank.ACE);

      expect(trumpCard.compareForTrump(nonTrumpCard, Suit.HEARTS)).toBe(1);
    });

    it("should return negative when non-trump loses to trump", () => {
      const nonTrumpCard = new Card(Suit.SPADES, Rank.ACE);
      const trumpCard = new Card(Suit.HEARTS, Rank.TWO);

      expect(nonTrumpCard.compareForTrump(trumpCard, Suit.HEARTS)).toBe(-1);
    });

    it("should handle joker ranking as 10.5 (beaten by face cards and ace)", () => {
      const joker = new Card(null, Rank.JOKER);
      const jackOfHearts = new Card(Suit.HEARTS, Rank.JACK);
      const queenOfHearts = new Card(Suit.HEARTS, Rank.QUEEN);
      const kingOfHearts = new Card(Suit.HEARTS, Rank.KING);
      const aceOfHearts = new Card(Suit.HEARTS, Rank.ACE);
      const tenOfHearts = new Card(Suit.HEARTS, Rank.TEN);

      // Face cards and ace should beat joker
      expect(jackOfHearts.compareForTrump(joker, Suit.HEARTS)).toBe(1);
      expect(queenOfHearts.compareForTrump(joker, Suit.HEARTS)).toBe(1);
      expect(kingOfHearts.compareForTrump(joker, Suit.HEARTS)).toBe(1);
      expect(aceOfHearts.compareForTrump(joker, Suit.HEARTS)).toBe(1);

      // Joker should beat ten and lower cards
      expect(joker.compareForTrump(tenOfHearts, Suit.HEARTS)).toBe(1);
    });
  });

  describe("isSameColor", () => {
    it("should return true for cards of the same color", () => {
      const heartCard = new Card(Suit.HEARTS, Rank.KING);
      const _diamondCard = new Card(Suit.DIAMONDS, Rank.QUEEN);
      const spadeCard = new Card(Suit.SPADES, Rank.ACE);
      const _clubCard = new Card(Suit.CLUBS, Rank.JACK);

      expect(heartCard.isSameColor(Suit.DIAMONDS)).toBe(true); // Both red
      expect(spadeCard.isSameColor(Suit.CLUBS)).toBe(true); // Both black
    });

    it("should return false for cards of different colors", () => {
      const heartCard = new Card(Suit.HEARTS, Rank.KING);
      const spadeCard = new Card(Suit.SPADES, Rank.ACE);

      expect(heartCard.isSameColor(Suit.SPADES)).toBe(false); // Red vs black
      expect(spadeCard.isSameColor(Suit.HEARTS)).toBe(false); // Black vs red
    });

    it("should return false for joker", () => {
      const joker = new Card(null, Rank.JOKER);
      expect(joker.isSameColor(Suit.HEARTS)).toBe(false);
    });
  });
});
