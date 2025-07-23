import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CardTheme } from "@/components/CardSprite";
import { CardThemeManager } from "./CardThemeManager";

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

describe("CardThemeManager", () => {
  let themeManager: CardThemeManager;

  beforeEach(() => {
    vi.clearAllMocks();
    themeManager = new CardThemeManager();
  });

  describe("initialization", () => {
    it("should initialize with default themes", () => {
      const themes = themeManager.getAllThemes();
      expect(themes.length).toBeGreaterThan(0);

      // Should have classic theme
      const classic = themeManager.getTheme("classic");
      expect(classic).toBeDefined();
      expect(classic?.name).toBe("Classic");
    });

    it("should set classic as default theme", () => {
      const currentTheme = themeManager.getCurrentTheme();
      expect(currentTheme.id).toBe("classic");
    });

    it("should have all required default themes", () => {
      const expectedThemes = ["classic", "modern", "neon", "vintage", "high_contrast"];

      expectedThemes.forEach((themeId) => {
        const theme = themeManager.getTheme(themeId);
        expect(theme).toBeDefined();
        expect(theme?.id).toBe(themeId);
      });
    });
  });

  describe("theme management", () => {
    it("should add new themes", () => {
      const customTheme: CardTheme = {
        id: "custom",
        name: "Custom Theme",
        cardBack: "custom_back",
        cardWidth: 100,
        cardHeight: 140,
        suits: {
          hearts: "♥",
          diamonds: "♦",
          clubs: "♣",
          spades: "♠",
        },
        colors: {
          red: 0xff0000,
          black: 0x000000,
          background: 0xffffff,
          border: 0x333333,
          highlight: 0x4a90e2,
          disabled: 0x888888,
        },
      };

      themeManager.addTheme(customTheme);
      const retrieved = themeManager.getTheme("custom");
      expect(retrieved).toEqual(customTheme);
    });

    it("should set current theme", () => {
      const success = themeManager.setCurrentTheme("modern");
      expect(success).toBe(true);

      const currentTheme = themeManager.getCurrentTheme();
      expect(currentTheme.id).toBe("modern");
    });

    it("should reject invalid theme IDs", () => {
      const success = themeManager.setCurrentTheme("nonexistent");
      expect(success).toBe(false);

      // Should remain on previous theme
      const currentTheme = themeManager.getCurrentTheme();
      expect(currentTheme.id).toBe("classic");
    });

    it("should get theme names for UI", () => {
      const themeNames = themeManager.getThemeNames();
      expect(themeNames.length).toBeGreaterThan(0);

      const classicTheme = themeNames.find((t) => t.id === "classic");
      expect(classicTheme).toEqual({ id: "classic", name: "Classic" });
    });
  });

  describe("custom theme creation", () => {
    it("should create custom theme based on existing theme", () => {
      const customTheme = themeManager.createCustomTheme("my_theme", "My Theme", "classic", {
        colors: {
          red: 0xff0000,
          black: 0x000000,
          background: 0x00ff00,
          border: 0x333333,
          highlight: 0x4a90e2,
          disabled: 0x888888,
        },
      });

      expect(customTheme.id).toBe("my_theme");
      expect(customTheme.name).toBe("My Theme");
      expect(customTheme.colors.background).toBe(0x00ff00);

      // Should inherit other properties from base theme
      const classic = themeManager.getTheme("classic");
      if (!classic) throw new Error("Classic theme not found");
      expect(customTheme.cardWidth).toBe(classic.cardWidth);
    });
  });

  describe("theme validation", () => {
    it("should validate complete theme configuration", () => {
      const validTheme: CardTheme = {
        id: "valid",
        name: "Valid Theme",
        cardBack: "valid_back",
        cardWidth: 90,
        cardHeight: 130,
        suits: {
          hearts: "♥",
          diamonds: "♦",
          clubs: "♣",
          spades: "♠",
        },
        colors: {
          red: 0xff0000,
          black: 0x000000,
          background: 0xffffff,
          border: 0x333333,
          highlight: 0x4a90e2,
          disabled: 0x888888,
        },
      };

      const errors = themeManager.validateTheme(validTheme);
      expect(errors).toHaveLength(0);
    });

    it("should detect missing required fields", () => {
      const invalidTheme = {
        name: "Invalid Theme",
        // Missing id and other required fields
      };

      const errors = themeManager.validateTheme(invalidTheme);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((error) => error.includes("ID is required"))).toBe(true);
    });

    it("should validate card dimensions", () => {
      const invalidDimensions = {
        id: "test",
        name: "Test",
        cardWidth: 25, // Too small
        cardHeight: 400, // Too large
        colors: {
          red: 0xff0000,
          black: 0x000000,
          background: 0xffffff,
          border: 0x333333,
          highlight: 0x4a90e2,
          disabled: 0x888888,
        },
      };

      const errors = themeManager.validateTheme(invalidDimensions);
      expect(errors.some((error) => error.includes("width"))).toBe(true);
      expect(errors.some((error) => error.includes("height"))).toBe(true);
    });

    it("should validate color configuration", () => {
      const missingColors: Partial<CardTheme> = {
        id: "test",
        name: "Test",
        colors: {
          red: 0xff0000,
          // Missing other required colors: black, background, border, highlight, disabled
        } as any,
      };

      const errors = themeManager.validateTheme(missingColors);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((error) => error.includes("Missing required color"))).toBe(true);
    });
  });

  describe("theme persistence", () => {
    it("should save theme preferences to localStorage", () => {
      themeManager.setCurrentTheme("modern");
      themeManager.saveThemePreferences();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "setback_theme_preferences",
        expect.stringContaining('"currentThemeId":"modern"')
      );
    });

    it("should load theme preferences from localStorage", () => {
      const preferences = {
        currentThemeId: "vintage",
        customThemes: [],
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(preferences));

      themeManager.loadThemePreferences();

      const currentTheme = themeManager.getCurrentTheme();
      expect(currentTheme.id).toBe("vintage");
    });

    it("should handle invalid localStorage data gracefully", () => {
      mockLocalStorage.getItem.mockReturnValue("invalid json");

      // Should not throw error
      expect(() => themeManager.loadThemePreferences()).not.toThrow();

      // Should remain on default theme
      const currentTheme = themeManager.getCurrentTheme();
      expect(currentTheme.id).toBe("classic");
    });
  });

  describe("theme export/import", () => {
    it("should export theme as JSON", () => {
      const exported = themeManager.exportTheme("classic");
      expect(exported).toBeTruthy();

      if (!exported) throw new Error("Export failed");
      const parsed = JSON.parse(exported);
      expect(parsed.id).toBe("classic");
      expect(parsed.name).toBe("Classic");
    });

    it("should return null for non-existent theme export", () => {
      const exported = themeManager.exportTheme("nonexistent");
      expect(exported).toBeNull();
    });

    it("should import valid theme JSON", () => {
      const themeJson = {
        id: "imported",
        name: "Imported Theme",
        cardBack: "imported_back",
        cardWidth: 90,
        cardHeight: 130,
        suits: {
          hearts: "♥",
          diamonds: "♦",
          clubs: "♣",
          spades: "♠",
        },
        colors: {
          red: 0xff0000,
          black: 0x000000,
          background: 0xffffff,
          border: 0x333333,
          highlight: 0x4a90e2,
          disabled: 0x888888,
        },
      };

      const result = themeManager.importTheme(JSON.stringify(themeJson));
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);

      const imported = themeManager.getTheme("imported");
      expect(imported).toBeDefined();
    });

    it("should reject invalid theme JSON", () => {
      const invalidJson = '{"id": "test"}'; // Missing required fields

      const result = themeManager.importTheme(invalidJson);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle malformed JSON", () => {
      const malformedJson = '{"id": "test"'; // Invalid JSON

      const result = themeManager.importTheme(malformedJson);
      expect(result.success).toBe(false);
      expect(result.errors).toContain("Invalid JSON format");
    });
  });

  describe("theme preview and accessibility", () => {
    it("should provide theme preview data", () => {
      const preview = themeManager.getThemePreview("classic");
      expect(preview).toBeDefined();
      expect(preview?.background).toMatch(/^#[0-9a-f]{6}$/i);
      expect(preview?.border).toMatch(/^#[0-9a-f]{6}$/i);
      expect(preview?.redColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(preview?.blackColor).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("should return null for invalid theme preview", () => {
      const preview = themeManager.getThemePreview("nonexistent");
      expect(preview).toBeNull();
    });

    it("should calculate contrast ratios", () => {
      const contrastInfo = themeManager.getContrastInfo("classic");
      expect(contrastInfo).toBeDefined();
      expect(typeof contrastInfo?.backgroundToRed).toBe("number");
      expect(typeof contrastInfo?.backgroundToBlack).toBe("number");
      expect(typeof contrastInfo?.accessible).toBe("boolean");
    });

    it("should identify high contrast theme as accessible", () => {
      const contrastInfo = themeManager.getContrastInfo("high_contrast");
      expect(contrastInfo?.accessible).toBe(true);
    });
  });

  describe("theme reset", () => {
    it("should reset to default theme", () => {
      themeManager.setCurrentTheme("modern");
      expect(themeManager.getCurrentTheme().id).toBe("modern");

      themeManager.resetToDefault();
      expect(themeManager.getCurrentTheme().id).toBe("classic");
    });
  });
});
