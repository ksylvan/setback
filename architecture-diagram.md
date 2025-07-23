# Setback Card Game - Comprehensive Architecture Diagram

## Project Overview
The Setback card game is a TypeScript-based web application built with Phaser 3 game engine, featuring a modular architecture with clear separation of concerns between game logic, presentation, and data management.

## Comprehensive Architecture Diagram

```mermaid
graph TB
    %% Define Styles
    classDef frameworkBox fill:#e1f5fe,stroke:#01579b,stroke-width:3px
    classDef entityBox fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef managerBox fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef sceneBox fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef componentBox fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef configBox fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    classDef testBox fill:#e0f2f1,stroke:#004d40,stroke-width:2px
    classDef buildBox fill:#fff8e1,stroke:#ff6f00,stroke-width:2px
    classDef assetBox fill:#f9fbe7,stroke:#827717,stroke-width:2px

    %% Top Level - Build & Development Tools
    subgraph "Build & Development Ecosystem"
        VITE[Vite<br/>• Dev Server<br/>• HMR<br/>• Asset Pipeline]:::buildBox
        BIOME[Biome<br/>• Linting<br/>• Formatting<br/>• Code Quality]:::buildBox
        TS[TypeScript<br/>• Type Safety<br/>• Module Resolution<br/>• @/ Path Aliases]:::buildBox
        VITEST[Vitest<br/>• Unit Tests<br/>• Coverage Reports<br/>• JSDOM Environment]:::testBox
    end

    %% Main Application Layer
    subgraph "Application Entry"
        MAIN[main.ts<br/>• Phaser Game Instance<br/>• Global Exports<br/>• Dev Tools]:::frameworkBox
        CONFIG[GameConfig.ts<br/>• Phaser Configuration<br/>• Scene Registration<br/>• Rendering Settings]:::configBox
    end

    %% Phaser 3 Framework Layer
    subgraph "Phaser 3 Game Engine"
        PHASER[Phaser 3 Framework<br/>• WebGL Renderer<br/>• Scene Management<br/>• Input System<br/>• Asset Loading]:::frameworkBox
        
        subgraph "Scene Architecture"
            BOOT[BootScene<br/>• Asset Loading<br/>• Card Texture Creation<br/>• Progress Display]:::sceneBox
            MENU[MenuScene<br/>• Player Configuration<br/>• Game Options<br/>• Theme Selection]:::sceneBox
            GAME[GameScene<br/>• Game UI Management<br/>• Player Interaction<br/>• Visual Updates]:::sceneBox
        end
    end

    %% Game Logic Layer
    subgraph "Core Game Logic"
        subgraph "Managers"
            GM[GameManager<br/>• Game State<br/>• Turn Management<br/>• Event Broadcasting<br/>• Rule Enforcement]:::managerBox
            CTM[CardThemeManager<br/>• Theme Management<br/>• Visual Customization<br/>• Local Storage<br/>• Accessibility]:::managerBox
        end

        subgraph "Entities"
            CARD[Card<br/>• Card Properties<br/>• Trump Logic<br/>• Comparison Methods<br/>• Validation]:::entityBox
            DECK[Deck<br/>• 53-Card Standard<br/>• Shuffle Algorithm<br/>• Deal Operations<br/>• Reset Functionality]:::entityBox
        end
    end

    %% UI Components Layer
    subgraph "UI Components"
        CS[CardSprite<br/>• Visual Card Rendering<br/>• Interactive Behaviors<br/>• Animation System<br/>• Theme Application]:::componentBox
    end

    %% Type System
    subgraph "Type System"
        TYPES[game.ts<br/>• Game Interfaces<br/>• Enums (Suit, Rank, Phase)<br/>• Player & Partnership<br/>• Scoring Types]:::configBox
        GLOBAL[global.d.ts<br/>• Global Type Declarations<br/>• Phaser Extensions]:::configBox
    end

    %% Asset Management
    subgraph "Asset Pipeline"
        CARDS[Card Assets<br/>• 53 Card Images (PNG)<br/>• 8 Card Back Themes<br/>• SVG Alternatives<br/>• High DPI Support]:::assetBox
        AUDIO[Audio Assets<br/>• Sound Effects<br/>• Background Music<br/>• User Feedback]:::assetBox
        FONTS[Font Assets<br/>• Custom Typography<br/>• Accessibility Fonts]:::assetBox
    end

    %% Testing Infrastructure
    subgraph "Testing Architecture"
        UNIT[Unit Tests<br/>• Card Logic<br/>• Deck Operations<br/>• Game Rules<br/>• Theme Management]:::testBox
        MOCK[Test Mocks<br/>• Phaser Mocking<br/>• DOM Environment<br/>• Event Emitters]:::testBox
        COV[Coverage Reports<br/>• 80% Thresholds<br/>• HTML Reports<br/>• LCOV Integration]:::testBox
    end

    %% Data Flow Arrows
    VITE --> MAIN
    TS --> MAIN
    MAIN --> PHASER
    CONFIG --> PHASER
    PHASER --> BOOT
    BOOT --> MENU
    MENU --> GAME
    
    GM --> GAME
    CTM --> GAME
    CS --> GAME
    
    CARD --> GM
    DECK --> GM
    CARD --> CS
    
    TYPES --> GM
    TYPES --> CARD
    TYPES --> DECK
    TYPES --> CS
    
    CARDS --> BOOT
    AUDIO --> BOOT
    FONTS --> BOOT
    
    BIOME --> TS
    VITEST --> UNIT
    UNIT --> GM
    UNIT --> CARD
    UNIT --> DECK
    UNIT --> CTM
    MOCK --> UNIT
    COV --> VITEST

    %% Event Flow (Game State Management)
    GM -.->|Events| GAME
    GAME -.->|User Actions| GM
    CS -.->|Card Selection| GAME
```

## Detailed Component Analysis

### 1. **Framework Layer (Phaser 3)**
- **Technology**: Phaser 3.90.0 with WebGL rendering
- **Configuration**: High-DPI support, responsive scaling, arcade physics
- **Scene Management**: Boot → Menu → Game flow with state persistence

### 2. **Game Logic Architecture**
- **GameManager**: Central state controller using EventEmitter pattern
  - Manages 4-player partnerships (North/South vs East/West)
  - Implements complete Setback rules (bidding, trump, trick-taking)
  - Handles game phases: Setup → Dealing → Bidding → Playing → Scoring
- **Card Entity**: Rich domain model with trump logic and comparison methods
- **Deck Entity**: Standard 53-card deck with proper shuffling and dealing

### 3. **UI/UX Layer**
- **CardSprite**: Interactive card rendering with theme support
  - 5 built-in themes (Classic, Modern, Neon, Vintage, High Contrast)
  - Smooth animations and hover effects
  - Accessibility features
- **Theme Management**: Complete theming system with local storage persistence

### 4. **Type System**
- **Comprehensive Types**: Strong typing for all game entities
- **Enums**: Suit, Rank, GamePhase, PlayerPosition for type safety
- **Interfaces**: Player, Partnership, Bid, Trick, GameState structures

### 5. **Asset Pipeline**
- **Card Graphics**: High-quality PNG sprites with theme variations
- **Scalable Design**: SVG alternatives for vector scaling
- **Asset Loading**: Efficient preloading with progress indication

### 6. **Testing Infrastructure**
- **Unit Tests**: Comprehensive coverage of game logic
- **Mocking Strategy**: Phaser framework mocking for isolated testing
- **Coverage Targets**: 80% minimum across all metrics
- **Test Categories**: 
  - Game logic tests (GameManager.test.ts, GameManager.cardplay.test.ts, GameManager.tricktaking.test.ts)
  - Entity tests (Card.test.ts, Deck.test.ts)
  - Component tests (CardSprite.test.ts, CardThemeManager.test.ts)

### 7. **Build & Development**
- **Vite**: Modern build tool with HMR and optimized bundling
- **Biome**: Fast linting and formatting with consistent code style
- **TypeScript**: Strict type checking with path aliases (@/ imports)
- **Package Management**: NPM with clear script organization

## Key Architectural Patterns

### 1. **Event-Driven Architecture**
- GameManager broadcasts events for all state changes
- UI components listen and react to game events
- Decoupled communication between layers

### 2. **Entity-Component-System (ECS) Influence**
- Clear separation between game entities (Card, Deck) and components (CardSprite)
- Managers handle systems and coordination
- Components handle presentation and interaction

### 3. **Theme Strategy Pattern**
- CardThemeManager implements strategy pattern for visual themes
- Runtime theme switching with persistence
- Extensible theme system for customization

### 4. **State Machine Pattern**
- GamePhase enum drives game state transitions
- Clear phase-based logic organization
- Predictable state flow management

## External Dependencies

### Runtime Dependencies
- **Phaser 3.90.0**: Core game engine
- **Events 3.3.0**: EventEmitter implementation

### Development Dependencies
- **TypeScript 5.8.3**: Type system and compilation
- **Vite 7.0.5**: Build tool and dev server
- **Vitest 3.2.4**: Testing framework
- **Biome 2.1.2**: Linting and formatting
- **@testing-library**: DOM testing utilities
- **JSDOM**: Browser environment simulation

## File Organization Summary

```
setback/
├── src/
│   ├── components/        # UI Components (CardSprite)
│   ├── entities/         # Game Entities (Card, Deck)
│   ├── game/            # Configuration (GameConfig)
│   ├── managers/        # Business Logic (GameManager, CardThemeManager)
│   ├── scenes/          # Phaser Scenes (Boot, Menu, Game)
│   ├── types/           # TypeScript Definitions
│   ├── test/            # Test Setup and Utilities
│   ├── assets/          # Game Assets (cards, audio, fonts)
│   └── main.ts          # Application Entry Point
├── docs/                # Project Documentation
├── coverage/            # Test Coverage Reports
├── dist/               # Build Output
└── public/             # Static Assets
```

This architecture provides a solid foundation for a maintainable, testable, and extensible card game implementation with clear separation of concerns and modern web development practices.