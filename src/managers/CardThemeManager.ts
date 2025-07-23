import { CardTheme } from '@/components/CardSprite';

/**
 * CardThemeManager - Handles multiple card themes and user preferences
 */
export class CardThemeManager {
  private themes: Map<string, CardTheme> = new Map();
  private currentThemeId: string = 'classic';

  constructor() {
    this.initializeDefaultThemes();
  }

  /**
   * Initialize the built-in card themes
   */
  private initializeDefaultThemes(): void {
    // Classic theme - traditional playing card look
    this.addTheme({
      id: 'classic',
      name: 'Classic',
      cardBack: 'cardBack_classic',
      cardWidth: 100,
      cardHeight: 100,
      suits: {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠'
      },
      colors: {
        red: 0xCC0000,
        black: 0x000000,
        background: 0xFFFFFF,
        border: 0x333333,
        highlight: 0x4A90E2,
        disabled: 0x888888
      }
    });

    // Modern theme - clean, minimal design with larger cards
    this.addTheme({
      id: 'modern',
      name: 'Modern',
      cardBack: 'cardBack_modern',
      cardWidth: 110,
      cardHeight: 110,
      suits: {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠'
      },
      colors: {
        red: 0xE74C3C,
        black: 0x2C3E50,
        background: 0xF8F9FA,
        border: 0xBDC3C7,
        highlight: 0x3498DB,
        disabled: 0x95A5A6
      }
    });

    // Neon theme - vibrant, glowing colors with smaller cards
    this.addTheme({
      id: 'neon',
      name: 'Neon',
      cardBack: 'cardBack_neon',
      cardWidth: 95,
      cardHeight: 95,
      suits: {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠'
      },
      colors: {
        red: 0xFF0080,
        black: 0x00FFFF,
        background: 0x1A1A1A,
        border: 0xFF00FF,
        highlight: 0x00FF00,
        disabled: 0x444444
      }
    });

    // Vintage theme - old-world charm with classic proportions
    this.addTheme({
      id: 'vintage',
      name: 'Vintage',
      cardBack: 'cardBack_vintage',
      cardWidth: 105,
      cardHeight: 105,
      suits: {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠'
      },
      colors: {
        red: 0x8B0000,
        black: 0x2F4F4F,
        background: 0xFDF5E6,
        border: 0x8B4513,
        highlight: 0xB8860B,
        disabled: 0x696969
      }
    });

    // High contrast theme - accessibility focused
    this.addTheme({
      id: 'high_contrast',
      name: 'High Contrast',
      cardBack: 'cardBack_contrast',
      cardWidth: 90,
      cardHeight: 130,
      suits: {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠'
      },
      colors: {
        red: 0xCC0000,  // Darker red for better contrast
        black: 0x000000,
        background: 0xFFFFFF,
        border: 0x000000,
        highlight: 0xFFFF00,
        disabled: 0x808080
      }
    });
  }

  /**
   * Add a new theme to the manager
   */
  public addTheme(theme: CardTheme): void {
    this.themes.set(theme.id, theme);
  }

  /**
   * Get a theme by ID
   */
  public getTheme(themeId: string): CardTheme | null {
    return this.themes.get(themeId) || null;
  }

  /**
   * Get the current active theme
   */
  public getCurrentTheme(): CardTheme {
    return this.themes.get(this.currentThemeId) || this.themes.get('classic')!;
  }

  /**
   * Set the current active theme
   */
  public setCurrentTheme(themeId: string): boolean {
    if (this.themes.has(themeId)) {
      this.currentThemeId = themeId;
      return true;
    }
    return false;
  }

  /**
   * Get all available themes
   */
  public getAllThemes(): CardTheme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Get theme names for UI selection
   */
  public getThemeNames(): Array<{id: string, name: string}> {
    return Array.from(this.themes.values()).map(theme => ({
      id: theme.id,
      name: theme.name
    }));
  }

  /**
   * Create a custom theme from user preferences
   */
  public createCustomTheme(
    id: string,
    name: string,
    baseThemeId: string = 'classic',
    customizations: Partial<CardTheme> = {}
  ): CardTheme {
    const baseTheme = this.getTheme(baseThemeId) || this.getCurrentTheme();
    
    const customTheme: CardTheme = {
      ...baseTheme,
      id,
      name,
      ...customizations
    };

    this.addTheme(customTheme);
    return customTheme;
  }

  /**
   * Save theme preferences to local storage
   */
  public saveThemePreferences(): void {
    try {
      const preferences = {
        currentThemeId: this.currentThemeId,
        customThemes: Array.from(this.themes.values()).filter(theme => 
          !['classic', 'modern', 'neon', 'vintage', 'high_contrast'].includes(theme.id)
        )
      };
      
      localStorage.setItem('setback_theme_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save theme preferences:', error);
    }
  }

  /**
   * Load theme preferences from local storage
   */
  public loadThemePreferences(): void {
    try {
      const saved = localStorage.getItem('setback_theme_preferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        
        // Load custom themes
        if (preferences.customThemes) {
          preferences.customThemes.forEach((theme: CardTheme) => {
            this.addTheme(theme);
          });
        }
        
        // Set current theme
        if (preferences.currentThemeId && this.themes.has(preferences.currentThemeId)) {
          this.currentThemeId = preferences.currentThemeId;
        }
      }
    } catch (error) {
      console.warn('Failed to load theme preferences:', error);
    }
  }

  /**
   * Reset to default theme
   */
  public resetToDefault(): void {
    this.currentThemeId = 'classic';
  }

  /**
   * Get theme preview data for UI
   */
  public getThemePreview(themeId: string): {
    background: string;
    border: string;
    redColor: string;
    blackColor: string;
  } | null {
    const theme = this.getTheme(themeId);
    if (!theme) return null;

    return {
      background: `#${theme.colors.background.toString(16).padStart(6, '0')}`,
      border: `#${theme.colors.border.toString(16).padStart(6, '0')}`,
      redColor: `#${theme.colors.red.toString(16).padStart(6, '0')}`,
      blackColor: `#${theme.colors.black.toString(16).padStart(6, '0')}`
    };
  }

  /**
   * Validate theme configuration
   */
  public validateTheme(theme: Partial<CardTheme>): string[] {
    const errors: string[] = [];

    if (!theme.id) errors.push('Theme ID is required');
    if (!theme.name) errors.push('Theme name is required');
    
    if (theme.cardWidth && (theme.cardWidth < 50 || theme.cardWidth > 200)) {
      errors.push('Card width must be between 50 and 200 pixels');
    }
    
    if (theme.cardHeight && (theme.cardHeight < 70 || theme.cardHeight > 280)) {
      errors.push('Card height must be between 70 and 280 pixels');
    }

    if (theme.colors) {
      const requiredColors = ['red', 'black', 'background', 'border', 'highlight', 'disabled'];
      requiredColors.forEach(color => {
        if (!(color in theme.colors!)) {
          errors.push(`Missing required color: ${color}`);
        }
      });
    }

    return errors;
  }

  /**
   * Export theme as JSON string
   */
  public exportTheme(themeId: string): string | null {
    const theme = this.getTheme(themeId);
    if (!theme) return null;

    return JSON.stringify(theme, null, 2);
  }

  /**
   * Import theme from JSON string
   */
  public importTheme(jsonString: string): { success: boolean; errors: string[]; theme?: CardTheme } {
    try {
      const theme = JSON.parse(jsonString) as Partial<CardTheme>;
      const errors = this.validateTheme(theme);
      
      if (errors.length === 0) {
        this.addTheme(theme as CardTheme);
        return { success: true, errors: [], theme: theme as CardTheme };
      } else {
        return { success: false, errors };
      }
    } catch (error) {
      return { success: false, errors: ['Invalid JSON format'] };
    }
  }

  /**
   * Get contrast ratio for accessibility
   */
  public getContrastInfo(themeId: string): {
    backgroundToRed: number;
    backgroundToBlack: number;
    accessible: boolean;
  } | null {
    const theme = this.getTheme(themeId);
    if (!theme) return null;

    // Simple contrast calculation (luminance-based)
    const getLuminance = (color: number): number => {
      const r = ((color >> 16) & 0xFF) / 255;
      const g = ((color >> 8) & 0xFF) / 255;
      const b = (color & 0xFF) / 255;
      
      const sRGB = [r, g, b].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };

    const bgLuminance = getLuminance(theme.colors.background);
    const redLuminance = getLuminance(theme.colors.red);
    const blackLuminance = getLuminance(theme.colors.black);

    const contrastRatio = (lighter: number, darker: number): number => 
      (lighter + 0.05) / (darker + 0.05);

    const bgToRed = bgLuminance > redLuminance ? 
      contrastRatio(bgLuminance, redLuminance) : 
      contrastRatio(redLuminance, bgLuminance);

    const bgToBlack = bgLuminance > blackLuminance ? 
      contrastRatio(bgLuminance, blackLuminance) : 
      contrastRatio(blackLuminance, bgLuminance);

    return {
      backgroundToRed: Math.round(bgToRed * 100) / 100,
      backgroundToBlack: Math.round(bgToBlack * 100) / 100,
      accessible: bgToRed >= 4.5 && bgToBlack >= 4.5  // WCAG AA standard
    };
  }
}