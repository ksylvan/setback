# Setback Game Implementation

In this interview, we will build a card game called Setback.

This question is designed to be open-ended; we can easily imagine spending a month or two full-time on this system. Rather than aiming for a “complete” answer, we’d like to understand how you work incrementally from lower fidelity to higher fidelity solutions using whatever tools make you most productive.

You should work within the editor you prefer, using your stack of choice. You may implement the game using a Web application stack, another GUI stack of your choice, in the terminal, or headless.

You should cheat shamelessly on this question. We want to see what you can do when you’re actually building something, using all of the tools at your disposal.

## Interview structure

- Pick a line of attack and build something in advance of our synchronous time together.

- During the first part of our synchronous time together (approx. 1 hour), we'll ask you to present your work, and then we'll discuss implementation choices, tradeoffs, correctness, and possible avenues for extension together.

- During the second part of our time together (approx. 1 hour), we'll extend your work in one of the directions we've discussed.

- Finally (approx 1. hour), we'll shift gears into a system design/architecture discussion, building on your work.

## Some notes on the question

- Current AI models may be able to one-shot the game logic. As with all AI-generated code, you will need to be certain it works, understand its structure, and be able to extend it.

- Play to your strengths.

- The sky’s the limit. Depending on what you’re really good at, here are some things that would make us cackle with delight:

  - High-fidelity game interface — animation, skinnable cards, generative avatars, a real sense of place.
  - Networked multiplayer system — chat, league play, massive multiplayer support, standings and statistics, or P2P/mesh over Bluetooth or using web technologies.
  - AI players with personality and style — especially if they can keep up lively table talk.
  - An extensible and pluggable game engine for trick-taking games, allowing us to play dozens of versions of pitch, or other card games, and to vary the rules at will.
  - Innovative interface implementations — on-chain, immediate-mode, rich terminal, SMS.
  - Insights into optimal strategy derived from analytics on massive AI round-robins.
  … bring your own swag.

## The rules of the game

Setback is played by four players in two partnerships (partners sit on opposite sides of the table from each other). Each player is dealt six cards from a 53-card deck containing the standard 52 cards plus a joker. Each deal is a “hand” (the cards held by a single player are also their “hand”).

In each hand, one suit is designated “trump”, and at least 3 and as many as 6 points are available to split between the two partnerships:

- Low of trump (always available)
- High of trump (always available)

- Majority of “small points” across all suits (always available) scored as follows:

  - Jack: 1
  - Queen: 2
  - King: 3
  - Ace: 4
  - 10: 10

- Jack of trump (available if dealt)

- “Off jack” of the other suit of the same color as trump (available if dealt)

- Joker (available if dealt)

The play of the hand begins with an auction phase in which, starting with the player sitting to the dealer’s left and continuing clockwise, players bid on how many points they believe their partnership will make. Players may bid for as few as 2 points or as many as 6, or may pass. If a player bids, their bid must be greater than any previous bid. Bidding continues until all players have passed or one player has bid 6. If all players pass without anyone bidding, bidding defaults to the dealer at 2.

The player who wins the auction designates the trump suit when they play the first card of the hand — the suit of this card is trump. Play proceeds clockwise, with each player playing a card. Players must follow the opening suit if possible, i.e., if they have at least one card of the same suit they must play it. For the purposes of the play of the hand, the joker counts as the 10.5 of trump. A trick may not be opened with the joker if another card is available.

The play of four cards constitutes a trick. The trick is won by the highest card played in the suit opened, or by the highest trump card played, if a trump card is played.

The winner of a trick opens the play of the following trick. Play continues until the cards of the hand are exhausted (i.e., there are six tricks).

The hand is then scored. If the partnership that won the auction (the “declaring” partnership) takes at least as many points as they bid, they get that many points. If they did not take at least as many points as they bid, their score is reduced by their bid. (Scores can be negative).

The partnership that did not win the auction always gets as many points as they take in the play of the hand.

Play continues until a declaring partnership ends a hand with 21 or more points.
