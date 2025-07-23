# Setback Card Game - Project Brief

- [Setback Card Game - Project Brief](#setback-card-game---project-brief)
  - [🎯 **Project Overview**](#-project-overview)
  - [📋 **Project Requirements**](#-project-requirements)
    - [**Functional Requirements**](#functional-requirements)
    - [**Technical Requirements**](#technical-requirements)
  - [🏗️ **Architecture Overview**](#️-architecture-overview)
    - [**Project Structure**](#project-structure)
    - [**Core Components**](#core-components)
      - [**🃏 Card System**](#-card-system)
      - [**🎮 Game Manager**](#-game-manager)
      - [**🖼️ Phaser 3 Scenes**](#️-phaser-3-scenes)
  - [📊 **Current Implementation Status**](#-current-implementation-status)
    - [**✅ Completed Features**](#-completed-features)
      - [**Core Game Engine**](#core-game-engine)
      - [**User Interface**](#user-interface)
      - [**Game Rules**](#game-rules)
    - [**🔄 In Development**](#-in-development)
      - [**Gameplay Mechanics**](#gameplay-mechanics)
      - [**AI Enhancement**](#ai-enhancement)
      - [**User Experience**](#user-experience)
    - [**🚀 Future Enhancements**](#-future-enhancements)
      - [**Advanced Features**](#advanced-features)
      - [**Technical Improvements**](#technical-improvements)
  - [🎯 **Game Rules Summary**](#-game-rules-summary)
    - [**Setup**](#setup)
    - [**Bidding Phase**](#bidding-phase)
    - [**Playing Phase**](#playing-phase)
    - [**Scoring System**](#scoring-system)
    - [**Winning**](#winning)
  - [🛠️ **Development Tools \& Setup**](#️-development-tools--setup)
    - [**Prerequisites**](#prerequisites)
    - [**Getting Started**](#getting-started)
    - [**Development Scripts**](#development-scripts)
  - [📝 **Next Development Phases**](#-next-development-phases)
    - [**Phase 1: Core Gameplay** (Current Priority)](#phase-1-core-gameplay-current-priority)
    - [**Phase 2: Polish \& AI**](#phase-2-polish--ai)
    - [**Phase 3: Advanced Features**](#phase-3-advanced-features)
  - [🧪 **Testing Strategy**](#-testing-strategy)
    - [**Unit Testing**](#unit-testing)
    - [**Integration Testing**](#integration-testing)
    - [**User Acceptance Testing**](#user-acceptance-testing)

## 🎯 **Project Overview**

**Project Name:** Setback Card Game
**Technology Stack:** Phaser 3 + TypeScript + Vite
**Target Audience:** Card game enthusiasts, casual gamers
**Platform:** Web (Desktop/Mobile responsive)
**Development Status:** Scaffolding Complete ✅

## 📋 **Project Requirements**

### **Functional Requirements**

- ✅ **4-Player Partnership Game**: North/South vs East/West partnerships
- ✅ **53-Card Deck**: Standard 52 cards + 1 joker
- ✅ **Bidding System**: Players bid 2-6 points, with pass option
- ✅ **Trump Mechanics**: Bid winner sets trump by leading first card
- ✅ **Scoring System**: 6 point categories (high, low, jack, off-jack, joker, game)
- 🔄 **Trick-Taking**: Play 6 tricks per hand, follow suit rules
- 🔄 **AI Players**: Intelligent computer opponents
- 🔄 **Game Progression**: First partnership to 21+ points wins

### **Technical Requirements**

- ✅ **Modern Web Stack**: ES2020, TypeScript 5.x, Vite 7.x
- ✅ **Phaser 3 Framework**: Latest version (3.90.0) with proper types
- ✅ **Responsive Design**: Works on desktop and mobile devices
- ✅ **Event-Driven Architecture**: Scalable, maintainable code structure
- 🔄 **Performance Optimization**: 60fps gameplay, minimal bundle size
- 🔄 **Accessibility**: Keyboard navigation, screen reader support

## 🏗️ **Architecture Overview**

### **Project Structure**

```text
setback-card-game/
├── src/
│   ├── game/           # Phaser configuration & core game setup
│   ├── scenes/         # Game scenes (Boot, Menu, Game)
│   ├── entities/       # Game objects (Card, Deck, Player)
│   ├── managers/       # Business logic (GameManager, ScoreManager)
│   ├── utils/          # Helper functions and utilities
│   ├── types/          # TypeScript interfaces and enums
│   └── assets/         # Graphics, audio, fonts
├── docs/              # Project documentation
└── public/            # Static assets
```

### **Core Components**

#### **🃏 Card System**

- **Card Class**: Implements Setback-specific rules (trump, off-jack, scoring)
- **Deck Class**: 53-card deck with shuffling and dealing
- **Hand Management**: Sorting, validation, playability checks

#### **🎮 Game Manager**

- **State Management**: Centralized game state with event emissions
- **Phase Control**: Handles dealing → bidding → playing → scoring flow
- **Player Management**: 4-player system with partnership tracking

#### **🖼️ Phaser 3 Scenes**

- **BootScene**: Asset loading, texture generation
- **MenuScene**: Main menu with instructions overlay
- **GameScene**: Full game interface with interactive elements

## 📊 **Current Implementation Status**

### **✅ Completed Features**

#### **Core Game Engine**

- [x] **Project Setup**: Vite + TypeScript + Phaser 3 configuration
- [x] **Card System**: Full Card/Deck implementation with Setback rules
- [x] **Game State**: Event-driven GameManager with partnership system
- [x] **Bidding Logic**: 2-6 point bidding with validation and AI

#### **User Interface**

- [x] **Scene Management**: Boot → Menu → Game flow
- [x] **Player Layout**: 4-player table positioning (N/S/E/W)
- [x] **Score Display**: Partnership score tracking
- [x] **Hand Display**: Human player card visualization
- [x] **Bidding UI**: Interactive bidding buttons with validation

#### **Game Rules**

- [x] **Deck Generation**: 53-card deck (52 standard + joker)
- [x] **Deal Logic**: 6 cards per player distribution
- [x] **Bidding Rules**: Pass/bid validation, dealer fallback
- [x] **Trump System**: Architecture for trump suit handling
- [x] **Scoring Framework**: All 6 Setback point categories defined

### **🔄 In Development**

#### **Gameplay Mechanics**

- [ ] **Card Playing**: Trick-taking logic with follow-suit rules
- [ ] **Trump Resolution**: First card played sets trump suit
- [ ] **Trick Evaluation**: Winner determination with trump precedence
- [ ] **Hand Scoring**: Point calculation and partnership updates

#### **AI Enhancement**

- [ ] **Smart Bidding**: AI strategy based on hand strength
- [ ] **Card Playing AI**: Intelligent play decisions
- [ ] **Partnership Coordination**: AI communication simulation

#### **User Experience**

- [ ] **Animation System**: Card dealing, playing, trick collection
- [ ] **Sound Effects**: Card sounds, UI feedback
- [ ] **Visual Polish**: Improved graphics, themes, backgrounds
- [ ] **Mobile Optimization**: Touch-friendly interface

### **🚀 Future Enhancements**

#### **Advanced Features**

- [ ] **Multiplayer Support**: Real-time networking
- [ ] **Tournament Mode**: Multi-game tournaments
- [ ] **Statistics Tracking**: Player performance analytics
- [ ] **Custom Rules**: Variant game modes

#### **Technical Improvements**

- [ ] **Performance Optimization**: Bundle splitting, lazy loading
- [ ] **Testing Suite**: Unit tests, integration tests
- [ ] **CI/CD Pipeline**: Automated testing and deployment
- [ ] **PWA Features**: Offline play, app installation

## 🎯 **Game Rules Summary**

### **Setup**

- **Players**: 4 players in 2 partnerships (North/South vs East/West)
- **Deck**: 53 cards (standard 52 + 1 joker)
- **Deal**: 6 cards per player each hand

### **Bidding Phase**

- **Starting Player**: Left of dealer begins bidding
- **Bid Range**: 2-6 points (or pass)
- **Rules**: Each bid must exceed previous, dealer stuck at 2 if all pass
- **End Condition**: 3 passes after bid, or someone bids 6 (shoot moon)

### **Playing Phase**

- **Trump Setting**: Bid winner leads first card, that suit becomes trump
- **Trick Rules**: Follow suit if possible, highest trump wins
- **Joker Special**: Counts as 10.5 of trump, cannot lead unless only card
- **6 Tricks**: Play continues until all cards played

### **Scoring System**

1. **High Trump** (1 pt): Highest trump card taken
2. **Low Trump** (1 pt): Lowest trump card taken
3. **Jack of Trump** (1 pt): If dealt and taken
4. **Off Jack** (1 pt): Jack of same color as trump, if dealt
5. **Joker** (1 pt): If dealt and taken
6. **Game Points** (1 pt): Most "small points" (J=1, Q=2, K=3, A=4, 10=10)

### **Winning**

- **Target**: First partnership to reach 21+ points
- **Bid Success**: Declaring partnership scores bid amount if successful
- **Bid Failure**: Declaring partnership loses bid amount (can go negative)
- **Defenders**: Always score points they actually take

## 🛠️ **Development Tools & Setup**

### **Prerequisites**

- Node.js 18+
- npm 9+
- Modern web browser with ES2020 support

### **Getting Started**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# TypeScript checking
npm run lint

# Build for production
npm run build
```

### **Development Scripts**

- `npm run dev` - Start Vite dev server with hot-reload
- `npm run build` - Production build with optimization
- `npm run preview` - Preview production build
- `npm run lint` - TypeScript compilation check

## 📝 **Next Development Phases**

### **Phase 1: Core Gameplay** (Current Priority)

- Implement card playing mechanics
- Complete trick-taking logic
- Add hand scoring system
- Basic game completion

### **Phase 2: Polish & AI**

- Enhance AI decision making
- Add animations and visual effects
- Improve user interface
- Mobile responsiveness

### **Phase 3: Advanced Features**

- Multiplayer networking
- Statistics and achievements
- Tournament modes
- Custom game variants

## 🧪 **Testing Strategy**

### **Unit Testing**

- Card logic validation
- Scoring calculations
- Game state transitions
- AI decision algorithms

### **Integration Testing**

- Full game flow testing
- Scene transitions
- Event system validation
- Error handling

### **User Acceptance Testing**

- Gameplay experience
- Rule compliance
- Interface usability
- Performance benchmarks

---

**Document Version:** 1.0
**Last Updated:** July 22, 2025
**Author:** Development Team
**Status:** Living Document - Updated with development progress
