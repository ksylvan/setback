/**
 * ResponsiveUtils - Utilities for responsive design and mobile optimization
 */

/**
 * Get responsive font size based on screen size and base size
 */
export function getResponsiveFontSize(baseFontSize: number): number {
  const screenWidth = window.innerWidth;
  const isTablet = screenWidth >= 768 && screenWidth <= 1366;
  const isMobile = screenWidth < 768;

  if (isMobile) {
    // Mobile: Increase font size significantly for better readability
    if (baseFontSize <= 12) return Math.ceil(baseFontSize * 2.2);
    if (baseFontSize <= 16) return Math.ceil(baseFontSize * 2.0);
    if (baseFontSize <= 20) return Math.ceil(baseFontSize * 1.8);
    return Math.ceil(baseFontSize * 1.6);
  } else if (isTablet) {
    // Tablet (iPad Pro): Significantly larger font size increase
    if (baseFontSize <= 12) return Math.ceil(baseFontSize * 2.0);
    if (baseFontSize <= 16) return Math.ceil(baseFontSize * 1.8);
    if (baseFontSize <= 20) return Math.ceil(baseFontSize * 1.6);
    return Math.ceil(baseFontSize * 1.4);
  } else {
    // Desktop: Use base size
    return baseFontSize;
  }
}

/**
 * Get responsive font size as CSS pixel string
 */
export function getResponsiveFontSizePx(baseFontSize: number): string {
  return `${getResponsiveFontSize(baseFontSize)}px`;
}

/**
 * Get responsive spacing/padding values
 */
export function getResponsiveSpacing(baseSpacing: number): number {
  const screenWidth = window.innerWidth;
  const isTablet = screenWidth >= 768 && screenWidth <= 1366;
  const isMobile = screenWidth < 768;

  if (isMobile) {
    return Math.ceil(baseSpacing * 2.0);
  } else if (isTablet) {
    return Math.ceil(baseSpacing * 1.8);
  } else {
    return baseSpacing;
  }
}

/**
 * Check if current device is mobile
 */
export function isMobile(): boolean {
  return window.innerWidth < 768;
}

/**
 * Check if current device is tablet
 */
export function isTablet(): boolean {
  const screenWidth = window.innerWidth;
  return screenWidth >= 768 && screenWidth <= 1366;
}

/**
 * Check if current device is desktop
 */
export function isDesktop(): boolean {
  return window.innerWidth > 1366;
}

/**
 * Get device type as string
 */
export function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (isMobile()) return "mobile";
  if (isTablet()) return "tablet";
  return "desktop";
}

/**
 * Get responsive button height for touch interactions
 */
export function getResponsiveButtonHeight(baseHeight: number): number {
  const deviceType = getDeviceType();

  switch (deviceType) {
    case "mobile":
      // Ensure minimum 44px touch target on mobile
      return Math.max(44, Math.ceil(baseHeight * 1.4));
    case "tablet":
      // Ensure minimum 40px touch target on tablet
      return Math.max(40, Math.ceil(baseHeight * 1.2));
    default:
      return baseHeight;
  }
}

/**
 * Get responsive button width for touch interactions
 */
export function getResponsiveButtonWidth(baseWidth: number): number {
  const deviceType = getDeviceType();

  switch (deviceType) {
    case "mobile":
      return Math.ceil(baseWidth * 1.3);
    case "tablet":
      return Math.ceil(baseWidth * 1.15);
    default:
      return baseWidth;
  }
}

/**
 * Get responsive margin/padding for UI elements
 */
export function getResponsiveMargin(baseMargin: number): number {
  return getResponsiveSpacing(baseMargin);
}

/**
 * Get minimum font size based on device type (accessibility)
 */
export function getMinimumFontSize(): number {
  const deviceType = getDeviceType();

  switch (deviceType) {
    case "mobile":
      return 20; // Minimum readable size on mobile
    case "tablet":
      return 18; // Minimum readable size on tablet
    default:
      return 12; // Desktop can handle smaller text
  }
}

/**
 * Ensure font size meets minimum accessibility requirements
 */
export function ensureMinimumFontSize(fontSize: number): number {
  return Math.max(fontSize, getMinimumFontSize());
}
