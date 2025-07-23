# Setback Card Game - Product Requirements Document (PRD)

- [Setback Card Game - Product Requirements Document (PRD)](#setback-card-game---product-requirements-document-prd)
  - [📋 **Document Information**](#-document-information)
  - [🎯 **Executive Summary**](#-executive-summary)
  - [🎮 **Product Overview**](#-product-overview)
    - [**What is Setback?**](#what-is-setback)
    - [**Why Build This?**](#why-build-this)
    - [**Target Audience**](#target-audience)
  - [🎯 **Product Goals \& Objectives**](#-product-goals--objectives)
    - [**Phase 1: Core Game Implementation (Current)**](#phase-1-core-game-implementation-current)
    - [**Phase 2: Polish \& Enhancement**](#phase-2-polish--enhancement)
    - [**Phase 3: Advanced Features**](#phase-3-advanced-features)
  - [🕹️ **Game Requirements**](#️-game-requirements)
    - [**Core Game Rules Implementation**](#core-game-rules-implementation)
      - [**Setup Requirements**](#setup-requirements)
      - [**Bidding Phase Requirements**](#bidding-phase-requirements)
      - [**Playing Phase Requirements**](#playing-phase-requirements)
      - [**Scoring Requirements**](#scoring-requirements)
      - [**Game Progression Requirements**](#game-progression-requirements)
  - [🎨 **User Experience Requirements**](#-user-experience-requirements)
    - [**Interface Requirements**](#interface-requirements)
      - [**Visual Design**](#visual-design)
      - [**Interaction Requirements**](#interaction-requirements)
      - [**Responsive Design**](#responsive-design)
    - [**Accessibility Requirements**](#accessibility-requirements)
  - [🤖 **AI Requirements**](#-ai-requirements)
    - [**AI Opponent Specifications**](#ai-opponent-specifications)
      - [**Bidding AI**](#bidding-ai)
      - [**Card Play AI**](#card-play-ai)
      - [**Partnership Coordination**](#partnership-coordination)
  - [⚡ **Performance Requirements**](#-performance-requirements)
    - [**Technical Performance**](#technical-performance)
    - [**Game Performance**](#game-performance)
    - [**Device Compatibility**](#device-compatibility)
  - [🛠️ **Technical Requirements**](#️-technical-requirements)
    - [**Technology Stack** ✅](#technology-stack-)
    - [**Architecture Requirements** ✅](#architecture-requirements-)
    - [**Code Quality Requirements**](#code-quality-requirements)
  - [📊 **Success Metrics**](#-success-metrics)
    - [**Technical Metrics**](#technical-metrics)
    - [**Gameplay Metrics**](#gameplay-metrics)
    - [**User Engagement Metrics** (Future)](#user-engagement-metrics-future)
  - [🚧 **Current Implementation Status**](#-current-implementation-status)
    - [**✅ Completed (Phase 0: Foundation)**](#-completed-phase-0-foundation)
    - [**🔄 In Progress (Phase 1: Core Game)**](#-in-progress-phase-1-core-game)
    - [**📋 Planned (Phase 2: Polish)**](#-planned-phase-2-polish)
  - [🎯 **Feature Prioritization**](#-feature-prioritization)
    - [**Must Have (MVP)**](#must-have-mvp)
    - [**Should Have (V1.1)**](#should-have-v11)
    - [**Could Have (V1.2)**](#could-have-v12)
    - [**Won't Have (V1.0)**](#wont-have-v10)
  - [🔄 **User Stories (Epic Level)**](#-user-stories-epic-level)
    - [**Epic 1: Core Gameplay**](#epic-1-core-gameplay)
    - [**Epic 2: User Interface**](#epic-2-user-interface)
    - [**Epic 3: AI Intelligence**](#epic-3-ai-intelligence)
  - [⚖️ **Constraints \& Assumptions**](#️-constraints--assumptions)
    - [**Technical Constraints**](#technical-constraints)
    - [**Business Constraints**](#business-constraints)
    - [**Assumptions**](#assumptions)
  - [🔍 **Risk Assessment**](#-risk-assessment)
    - [**Technical Risks**](#technical-risks)
    - [**Product Risks**](#product-risks)
  - [📝 **Appendices**](#-appendices)
    - [**Appendix A: Setback Rules Reference**](#appendix-a-setback-rules-reference)
    - [**Appendix B: Technical Architecture**](#appendix-b-technical-architecture)
    - [**Appendix C: Development Process**](#appendix-c-development-process)
  - [📋 **Document Approval**](#-document-approval)

## 📋 **Document Information**

- **Document Type:** Product Requirements Document
- **Version:** 1.0
- **Created:** July 22, 2025
- **Last Updated:** July 22, 2025
- **Status:** Active
- **Owner:** Product Team
- **Reviewers:** Development Team, Stakeholders

---

## 🎯 **Executive Summary**

**Product Vision:** Create the definitive web-based Setback card game experience that captures the authentic gameplay of this traditional 4-player partnership card game while leveraging modern web technologies for superior user experience.

**Mission Statement:** Deliver a polished, accessible, and engaging digital implementation of Setback that serves both casual players learning the game and experienced players seeking competitive play.

**Success Criteria:**

- ✅ **Technical Excellence**: Modern, performant web application
- 🎯 **Authentic Gameplay**: 100% rule-compliant Setback implementation
- 🎮 **Engaging Experience**: Intuitive interface with smart AI opponents
- 📈 **Scalable Platform**: Foundation for multiplayer and tournament features

---

## 🎮 **Product Overview**

### **What is Setback?**

Setback (also known as Pitch) is a traditional American trick-taking card game played by four players in two partnerships. Partners sit opposite each other, and the goal is to be the first partnership to reach 21 points through strategic bidding and card play.

### **Why Build This?**

- **Market Gap**: Limited high-quality web implementations of Setback
- **Technical Showcase**: Demonstrate modern web game development capabilities
- **Accessibility**: Make this traditional game available to digital audiences
- **Extensibility**: Create foundation for multiplayer and tournament features
- **Have Fun Passing the Interview**: This is part of the [Meanwhile](https://meanwhile.bm) Interview loop

### **Target Audience**

1. **Primary**: Card game enthusiasts familiar with trick-taking games
2. **Secondary**: Casual gamers interested in learning traditional card games
3. **Tertiary**: Developers and stakeholders evaluating technical capabilities

---

## 🎯 **Product Goals & Objectives**

### **Phase 1: Core Game Implementation (Current)**

**Timeline:** Q3 2025
**Goal:** Deliver fully functional single-player Setback game

**Key Results:**

- ✅ Complete game scaffolding with modern tech stack
- 🔄 Implement full game flow (bidding → playing → scoring)
- 🔄 Deploy functional AI opponents
- 🔄 Achieve 60fps performance on target devices

### **Phase 2: Polish & Enhancement**

**Timeline:** Q4 2025
**Goal:** Enhance user experience and visual polish

**Key Results:**

- Implement smooth animations and transitions
- Add audio feedback and sound design
- Optimize for mobile devices
- Achieve 95%+ rule compliance accuracy

### **Phase 3: Advanced Features**

**Timeline:** Q1 2026
**Goal:** Enable advanced gameplay features

**Key Results:**

- Real-time multiplayer support
- Tournament/league functionality
- Statistics and analytics
- Multiple game variants

---

## 🕹️ **Game Requirements**

### **Core Game Rules Implementation**

#### **Setup Requirements**

- **Players**: Exactly 4 players in 2 partnerships
- **Partnerships**: North/South vs East/West seating
- **Deck**: 53 cards (standard 52 + 1 joker)
- **Deal**: 6 cards per player each hand

#### **Bidding Phase Requirements**

```text
GIVEN: Bidding phase begins
WHEN: Player evaluates their hand
THEN: Player can bid 2-6 points OR pass

GIVEN: Current bid exists
WHEN: Player wants to bid
THEN: New bid must exceed current bid

GIVEN: All players pass
WHEN: Bidding ends
THEN: Dealer is stuck with 2-point bid

GIVEN: Player bids 6
WHEN: Bid is placed
THEN: Bidding ends immediately ("shoot the moon")
```

#### **Playing Phase Requirements**

```text
GIVEN: Bidding complete
WHEN: Bid winner leads first card
THEN: That card's suit becomes trump

GIVEN: Card is played
WHEN: Other players follow
THEN: Must follow lead suit if possible

GIVEN: Cannot follow suit
WHEN: Player chooses card
THEN: Can play any card including trump

GIVEN: Trick is complete
WHEN: All 4 cards played
THEN: Highest trump wins, or highest lead suit if no trump
```

#### **Scoring Requirements**

```text
Points Available (3-6 per hand):
1. High Trump (1 pt) - ALWAYS available
2. Low Trump (1 pt) - ALWAYS available
3. Game Points (1 pt) - ALWAYS available (most small points)
4. Jack of Trump (1 pt) - IF DEALT
5. Off Jack (1 pt) - IF DEALT (same color as trump)
6. Joker (1 pt) - IF DEALT

Small Points Values:
- Jack: 1 point
- Queen: 2 points
- King: 3 points
- Ace: 4 points
- Ten: 10 points
```

#### **Game Progression Requirements**

```text
GIVEN: Hand is scored
WHEN: Declaring partnership made their bid
THEN: They score their bid amount

GIVEN: Hand is scored
WHEN: Declaring partnership failed their bid
THEN: They lose their bid amount (can go negative)

GIVEN: Hand is scored
WHEN: Non-declaring partnership
THEN: Always scores points they actually took

GIVEN: Hand is complete
WHEN: Any partnership has 21+ points
THEN: That partnership wins the game
```

---

## 🎨 **User Experience Requirements**

### **Interface Requirements**

#### **Visual Design**

- **Theme**: Classic card table aesthetic with green felt background
- **Cards**: Clear, readable card faces with traditional suits
- **Layout**: Standard bridge table layout (N/S/E/W positioning)
- **Typography**: Clean, readable fonts for scores and player names
- **Color Scheme**: Professional gaming colors (greens, blues, whites)

#### **Interaction Requirements**

```text
GIVEN: Human player's turn to bid
WHEN: Bidding UI appears
THEN: Show buttons for 2,3,4,5,6,Pass with current bid disabled

GIVEN: Human player's turn to play
WHEN: Cards are selectable
THEN: Highlight playable cards, dim unplayable cards

GIVEN: Game state changes
WHEN: Event occurs (bid placed, card played, etc.)
THEN: Provide immediate visual feedback

GIVEN: Player wants information
WHEN: Hovering/clicking on elements
THEN: Show tooltips with helpful context
```

#### **Responsive Design**

- **Desktop**: Optimized for 1200x800 minimum resolution
- **Tablet**: Touch-friendly interface for iPad-sized devices
- **Mobile**: Playable on phones with adjusted layout
- **Performance**: Maintain 60fps across all target devices

### **Accessibility Requirements**

- **Keyboard Navigation**: Full game playable without mouse
- **Screen Reader**: Compatible with assistive technologies
- **Color Blind**: Ensure suit differentiation beyond color
- **Text Scaling**: Support browser zoom up to 150%

---

## 🤖 **AI Requirements**

### **AI Opponent Specifications**

#### **Bidding AI**

```text
GIVEN: AI evaluates hand for bidding
WHEN: Calculating bid strength
THEN: Consider trump potential, point cards, jacks, joker

GIVEN: AI has strong hand (7+ tricks estimated)
WHEN: Bidding opportunity
THEN: Bid aggressively to control trump

GIVEN: AI has weak hand (<4 tricks estimated)
WHEN: Bidding opportunity
THEN: Pass unless forced (dealer position)

GIVEN: Current bid is high (5-6 points)
WHEN: AI evaluates hand
THEN: Only bid if hand can realistically make it
```

#### **Card Play AI**

```text
GIVEN: AI leads trick
WHEN: Selecting card
THEN: Lead strong suits or setup partner

GIVEN: AI follows suit
WHEN: Partner is winning
THEN: Play low to preserve high cards

GIVEN: AI follows suit
WHEN: Opponent is winning
THEN: Play higher to win if advantageous

GIVEN: AI cannot follow suit
WHEN: Choosing card
THEN: Trump if beneficial, otherwise discard safely
```

#### **Partnership Coordination**

```text
GIVEN: AI and partner are on same team
WHEN: Making decisions
THEN: Consider both players' likely holdings

GIVEN: Partner bid the hand
WHEN: Playing cards
THEN: Help partner make their bid

GIVEN: Opponents bid the hand
WHEN: Playing cards
THEN: Prevent opponents from making bid
```

---

## ⚡ **Performance Requirements**

### **Technical Performance**

- **Frame Rate**: Maintain 60fps during gameplay
- **Load Time**: Initial game load < 3 seconds
- **Memory Usage**: < 50MB total memory footprint
- **Bundle Size**: < 5MB compressed JavaScript bundle

### **Game Performance**

- **AI Response Time**: AI decisions within 1-2 seconds
- **Animation Smoothness**: Card movements at 60fps
- **State Updates**: Game state changes reflected instantly
- **Error Recovery**: Graceful handling of all edge cases

### **Device Compatibility**

- **Browsers**: Chrome 90+, Firefox 85+, Safari 14+, Edge 90+
- **Mobile**: iOS 14+, Android 8+
- **Desktop**: Windows 10+, macOS 10.15+, Ubuntu 18+

---

## 🛠️ **Technical Requirements**

### **Technology Stack** ✅

- **Frontend Framework**: Phaser 3.90.0 (game engine)
- **Language**: TypeScript 5.x (type safety)
- **Build Tool**: Vite 7.x (fast development)
- **Package Manager**: npm (dependency management)

### **Architecture Requirements** ✅

- **Pattern**: Event-driven architecture with clear separation of concerns
- **State Management**: Centralized GameManager with EventEmitter
- **Type Safety**: Comprehensive TypeScript interfaces
- **Modularity**: Pluggable components for future extensions

### **Code Quality Requirements**

- **Testing**: 80%+ code coverage on core game logic
- **Documentation**: All public APIs documented
- **Type Coverage**: 100% TypeScript coverage
- **Performance**: No memory leaks, optimal object pooling

---

## 📊 **Success Metrics**

### **Technical Metrics**

- ✅ **Build Success**: Clean TypeScript compilation
- ✅ **Performance**: 60fps maintained during gameplay
- 🔄 **Test Coverage**: 80%+ on game logic components
- 🔄 **Bundle Efficiency**: <5MB production bundle

### **Gameplay Metrics**

- 🔄 **Rule Compliance**: 100% accurate Setback rules
- 🔄 **AI Quality**: Challenging but fair AI opponents
- 🔄 **User Experience**: Smooth, intuitive interface
- 🔄 **Error Handling**: Graceful edge case management

### **User Engagement Metrics** (Future)

- Game completion rate
- Average session duration
- Return user percentage
- User satisfaction scores

---

## 🚧 **Current Implementation Status**

### **✅ Completed (Phase 0: Foundation)**

- **Project Setup**: Modern development environment with Vite + TypeScript
- **Game Architecture**: Event-driven GameManager with comprehensive type system
- **Card System**: Full Card/Deck implementation with Setback-specific rules
- **Basic UI**: Phaser 3 scenes with player layout and basic interactions
- **Bidding System**: Complete bidding logic with validation and basic AI
- **Documentation**: Comprehensive technical documentation and architecture

### **🔄 In Progress (Phase 1: Core Game)**

- **Card Playing**: Trick-taking logic implementation
- **Scoring System**: Hand scoring calculation and partnership updates
- **Game Completion**: Full game flow from start to finish
- **AI Enhancement**: Improved AI decision-making algorithms

### **📋 Planned (Phase 2: Polish)**

- **Animation System**: Smooth card movements and transitions
- **Audio Design**: Sound effects and feedback
- **Visual Polish**: Enhanced graphics and UI improvements
- **Mobile Optimization**: Responsive design and touch controls

---

## 🎯 **Feature Prioritization**

### **Must Have (MVP)**

1. **Complete Game Flow**: Bidding → Playing → Scoring → Game End
2. **Rule Compliance**: 100% accurate Setback implementation
3. **Functional AI**: Competent AI opponents for all 3 computer players
4. **Basic UI**: Clean, usable interface for human player

### **Should Have (V1.1)**

1. **Animation System**: Smooth card dealing and playing animations
2. **Audio Feedback**: Card sounds and UI audio cues
3. **Mobile Support**: Touch-optimized interface
4. **Game Statistics**: Basic scoring history and statistics

### **Could Have (V1.2)**

1. **Multiple Difficulty Levels**: AI skill options
2. **Game Variants**: Alternative Setback rule sets
3. **Save/Load**: Game state persistence
4. **Themes**: Multiple visual themes and card designs

### **Won't Have (V1.0)**

1. **Multiplayer**: Real-time networking (Phase 3)
2. **Tournaments**: Organized play features (Phase 3)
3. **Chat System**: Player communication (Phase 3)
4. **Analytics**: Advanced metrics and reporting (Phase 3)

---

## 🔄 **User Stories (Epic Level)**

### **Epic 1: Core Gameplay**

```text
AS A card game player
I WANT TO play a complete game of Setback against AI opponents
SO THAT I can enjoy this traditional card game digitally

Acceptance Criteria:
- Game follows all standard Setback rules
- AI opponents provide engaging competition
- Game has clear winner determination
- All scoring categories implemented correctly
```

### **Epic 2: User Interface**

```text
AS A player
I WANT an intuitive and responsive game interface
SO THAT I can focus on strategy rather than learning the interface

Acceptance Criteria:
- Clear visual feedback for all game states
- Easy-to-understand bidding and card play controls
- Responsive design works on desktop and mobile
- Professional visual design enhances gameplay
```

### **Epic 3: AI Intelligence**

```text
AS A player seeking a challenge
I WANT intelligent AI opponents with realistic play patterns
SO THAT the game remains engaging and educational

Acceptance Criteria:
- AI makes reasonable bidding decisions
- AI follows optimal card-play strategies
- AI demonstrates partnership coordination
- AI difficulty is challenging but not frustrating
```

---

## ⚖️ **Constraints & Assumptions**

### **Technical Constraints**

- **Web Platform**: Must run in standard web browsers without plugins
- **Single Device**: No cross-device synchronization in initial version
- **Client-Side**: All game logic runs locally (no server required)
- **Performance**: Must work on mid-range devices from 2020+

### **Business Constraints**

- **Timeline**: Phase 1 completion target Q3 2025
- **Resources**: Small development team (1-2 developers)
- **Budget**: Open-source project with minimal external dependencies
- **Scope**: Focus on single-player experience initially

### **Assumptions**

- **User Knowledge**: Players either know Setback or are willing to learn
- **Browser Support**: Modern browsers with ES2020 support
- **Internet Access**: Required for initial game load only
- **Device Capabilities**: Touch support for mobile, mouse for desktop

---

## 🔍 **Risk Assessment**

### **Technical Risks**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance issues on mobile | Medium | High | Early mobile testing, performance optimization |
| AI complexity underestimated | Low | Medium | Iterative AI improvement, fallback strategies |
| Browser compatibility issues | Low | Medium | Comprehensive cross-browser testing |

### **Product Risks**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Rule interpretation ambiguities | Medium | High | Reference multiple Setback sources, user testing |
| User interface complexity | Low | Medium | User testing, iterative design improvements |
| Scope creep to multiplayer | Medium | High | Clear phase boundaries, disciplined backlog management |

---

## 📝 **Appendices**

### **Appendix A: Setback Rules Reference**

- Complete rules documentation: [docs/setback-project.md](./setback-project.md)
- External reference: [Pagat.com Setback Rules](https://www.pagat.com/allfours/pitch.html)

### **Appendix B: Technical Architecture**

- Detailed technical specifications: [docs/architecture.md](./architecture.md)
- Implementation patterns and design decisions

### **Appendix C: Development Process**

- Project development history: [docs/project-brief.md](./project-brief.md)
- Technology choices and implementation approach

---

## 📋 **Document Approval**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Product Owner** | Development Team | July 2025 | ✅ Approved |
| **Tech Lead** | Game Developer Agent | July 2025 | ✅ Approved |
| **Scrum Master** | Jordan (Game SM) | July 2025 | ✅ Approved |

---

**Document Status:** ✅ **Approved & Active**
**Next Review:** August 2025
**Distribution:** Development Team, Stakeholders
**Version Control:** Living document - updated with product evolution
