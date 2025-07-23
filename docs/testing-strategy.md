# Testing Strategy - Setback Card Game

## Overview

This document outlines the comprehensive testing strategy for the Setback card game project. Our testing approach ensures high code quality, robust game logic, and reliable user experience through automated testing at multiple levels.

## Testing Infrastructure

### Framework: Vitest + Testing Library

- **Vitest**: Modern, fast test runner with excellent TypeScript support
- **@testing-library/dom**: DOM utilities for component testing
- **@testing-library/jest-dom**: Additional matchers for DOM assertions
- **jsdom**: Browser environment simulation for game logic testing

### Coverage Requirements

- **Line Coverage**: 80% minimum for all new code
- **Branch Coverage**: 80% minimum for decision logic
- **Function Coverage**: 80% minimum for all methods
- **Statement Coverage**: 80% minimum for code execution

### Test Environment Setup

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';

// Mock Phaser for testing
global.Phaser = { /* Mock implementation */ };
global.EventEmitter = MockEventEmitter;
global.__DEV__ = true;
```

## Testing Levels

### 1. Unit Tests

**Purpose**: Test individual components and functions in isolation

**Scope**:

- Card class methods (comparison, trump logic, validation)
- Deck class operations (shuffling, dealing, management)
- GameManager methods (bidding, scoring, state management)
- Utility functions and helpers

**Location**: `src/**/*.test.ts` (co-located with source files)

**Example**:

```typescript
describe('Card.compareForTrump', () => {
  it('should rank joker higher than all trump cards', () => {
    const joker = new Card(null, Rank.JOKER);
    const jackOfTrump = new Card(Suit.HEARTS, Rank.JACK);

    expect(joker.compareForTrump(jackOfTrump, Suit.HEARTS)).toBe(1);
  });
});
```

### 2. Integration Tests

**Purpose**: Test component interactions and system behavior

**Scope**:

- Complete game flow scenarios (bidding → playing → scoring)
- Card play validation with game state
- Event emission and handling between components
- Multi-step operations (deal → bid → play tricks → score)

**Location**: `src/**/*.integration.test.ts`

**Example**:

```typescript
describe('Complete Hand Integration', () => {
  it('should complete full hand from dealing to scoring', () => {
    gameManager.startGame();
    // ... play all cards through 6 tricks
    // ... verify scoring is calculated correctly
    // ... verify game state transitions properly
  });
});
```

### 3. End-to-End Tests

**Purpose**: Test complete user workflows and game scenarios

**Scope**:

- Full game sessions from start to finish
- Complex rule interactions (trump determination, off-jack logic)
- Edge cases (negative scoring, tie-breaking)
- Multi-hand games with score accumulation

**Location**: `src/test/e2e/`

## Testing Strategy by Epic

### Epic 1: Core Gameplay

#### SB-001: Card Playing Mechanics

**Testing Focus**: Rule validation and state management

- Valid/invalid card plays with various hand compositions
- Trump suit establishment and propagation
- Turn order enforcement
- Game state consistency after card plays

**Key Test Cases**:

- Player must follow suit when possible
- Trump cards can be played when can't follow suit
- First card determines trump suit
- Invalid plays are properly rejected

#### SB-002: Trick-Taking Logic

**Testing Focus**: Complex trump hierarchy and trick evaluation

- Trump card hierarchy (joker > jack > off-jack > other trump)
- Lead suit vs trump suit comparisons
- Trick winner determination across all scenarios
- Hand completion detection

**Key Test Cases**:

- All-trump tricks with proper ranking
- Mixed trump/non-trump tricks
- Off-jack special case handling
- Joker always wins scenarios

#### SB-004: Scoring System

**Testing Focus**: Accurate point calculation and bid evaluation

- All 6 scoring categories (High, Low, Jack, Off-Jack, Joker, Game)
- Small points calculation (30 total per hand)
- Bid success/failure logic
- Negative scoring for failed bids

**Key Test Cases**:

- Maximum points possible (6) scenarios
- Small points tie-breaking (bidders win)
- Partnership score accumulation
- Edge cases (no trump taken, all trump taken)

### Epic 2: User Interface

#### Testing Focus**: User interaction and visual feedback

- Card selection and highlighting
- Animation state management
- Responsive layout across devices
- Accessibility compliance

### Epic 3: AI Intelligence

**Testing Focus**: AI decision quality and performance

- Bidding strategy validation
- Card play decision trees
- Partnership coordination logic
- Performance under load

## Test Data Management

### Mock Data

- **Sample Hands**: Pre-defined card combinations for consistent testing
- **Game States**: Serialized states for complex scenario testing
- **Player Configurations**: Various human/AI combinations

### Test Fixtures

```typescript
// src/test/fixtures/game-states.ts
export const SAMPLE_HANDS = {
  HIGH_TRUMP_SCENARIO: [/* cards */],
  ALL_TRUMP_HAND: [/* cards */],
  NO_TRUMP_HAND: [/* cards */]
};
```

## Performance Testing

### Benchmarks

- **Trick Evaluation**: < 10ms per trick
- **Hand Scoring**: < 50ms per hand
- **Full Game**: < 2 seconds start to finish
- **Test Suite**: < 30 seconds complete execution

### Load Testing

- Multiple concurrent games (future multiplayer)
- Memory usage patterns
- Event handler performance

## Test Automation

### Continuous Integration

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: |
    npm run test:coverage
    npm run lint
    npm run build
```

### Pre-commit Hooks

- Run relevant tests for changed files
- Ensure coverage thresholds maintained
- TypeScript compilation check

## Coverage Reporting

### HTML Reports

Generated in `coverage/` directory with detailed line-by-line analysis

### Console Output

Real-time coverage feedback during development

### Threshold Enforcement

Build fails if coverage drops below 80% in any category

## Quality Gates

### Definition of Done Criteria

1. ✅ All tests passing
2. ✅ 80%+ coverage maintained
3. ✅ No TypeScript compilation errors
4. ✅ Performance benchmarks met
5. ✅ Manual testing completed

### Review Requirements

- Code review includes test coverage analysis
- New features must include comprehensive tests
- Bug fixes must include regression tests

## Tools and Commands

### Development

```bash
npm run test              # Run tests in watch mode
npm run test:ui          # Open Vitest UI for interactive testing
npm run test:coverage    # Generate coverage report
```

### CI/CD

```bash
npm run test:run         # Single test run for CI
npm run test:coverage    # Coverage enforcement
```

## Best Practices

### Test Organization

- Group related tests with `describe` blocks
- Use descriptive test names that explain expected behavior
- Follow AAA pattern: Arrange, Act, Assert

### Test Independence

- Each test should be completely independent
- Use `beforeEach` for test setup
- Clean up state after tests

### Mocking Strategy

- Mock external dependencies (Phaser, DOM APIs)
- Use real implementations for game logic
- Mock time-dependent operations

### Data Validation

- Test boundary conditions
- Verify error handling
- Test with realistic game data

---

**Document Status**: Living document, updated with each epic implementation
**Last Updated**: Development Phase 1a
**Next Review**: After SB-001 completion
