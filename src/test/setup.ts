import '@testing-library/jest-dom';

// Global test setup for Vitest
(global as any).__DEV__ = true;

// Mock Phaser for testing
global.Phaser = {
  Game: class MockGame {},
  Scene: class MockScene {},
  GameObjects: {
    Container: class MockContainer {},
    Image: class MockImage {},
    Text: class MockText {},
  },
  Input: {
    Events: {
      POINTER_DOWN: 'pointerdown',
      POINTER_UP: 'pointerup',
    },
  },
  Scale: {
    FIT: 'fit',
    CENTER_BOTH: 'center-both',
  },
} as any;

// Mock EventEmitter for tests
(global as any).EventEmitter = class MockEventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(...args));
    }
  }

  removeAllListeners() {
    this.events = {};
  }
};