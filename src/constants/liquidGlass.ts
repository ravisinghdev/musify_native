/**
 * Monochromatic Liquid Glass Design System Tokens
 * Pure shades of White, Silver, Charcoal & OLED True Black
 * High-end Swiss / Apple Pro luxury aesthetic
 */

export const LIQUID_GLASS = {
  // Atmospheric Canvas: Monochromatic OLED Void
  canvas: {
    base: '#000000',      // Pure 100% OLED Black
    surface: '#0A0A0C',   // Subtle Charcoal Surface
    card: '#121215',      // Elevated Card Base
    accent: '#FFFFFF',    // Crisp Pure White Accent
  },

  // 3 Monochromatic Liquid Glass Materials
  material: {
    // 1. PRIMARY GLASS: Floating Panels (Modals, Player, Profile Cards)
    primary: {
      tint: 'rgba(255, 255, 255, 0.06)',
      border: 'rgba(255, 255, 255, 0.18)',
      blur: 80,
    },
    // 2. SECONDARY GLASS: Lists, Search, Category Pills, Interactive Rows
    secondary: {
      tint: 'rgba(255, 255, 255, 0.04)',
      border: 'rgba(255, 255, 255, 0.10)',
      borderActive: 'rgba(255, 255, 255, 0.40)',
      blur: 60,
    },
    // 3. FLOATING DOCK GLASS: Bottom Bar, Capsule Buttons & Control Pills
    dock: {
      tint: 'rgba(20, 20, 24, 0.75)',
      pillTint: 'rgba(255, 255, 255, 0.12)',
      border: 'rgba(255, 255, 255, 0.15)',
      blur: 90,
    },
  },

  // Monochromatic Typography Hierarchy
  text: {
    primary: '#FFFFFF',                  // 100% Pure White
    secondary: 'rgba(255, 255, 255, 0.85)', // Crisp Silver
    tertiary: 'rgba(255, 255, 255, 0.55)',  // Muted Platinum
    muted: 'rgba(255, 255, 255, 0.32)',     // Dark Graphite
    accent: '#FFFFFF',                      // Pure White
  },

  // Physical Ambient Shadows
  shadow: {
    floating: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.65,
      shadowRadius: 24,
      elevation: 14,
    },
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.40,
      shadowRadius: 14,
      elevation: 6,
    },
  },

  // Layout Spacing Tokens
  layout: {
    navBarHeight: 62,
    navBottomMargin: 12,
    miniPlayerHeight: 64,
    miniPlayerBottomMargin: 82,
    scrollBottomPadding: 168,
  },
};
