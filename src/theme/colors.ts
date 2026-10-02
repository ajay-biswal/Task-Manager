export const colors = {
  light: {
    background: "#FFFFFF",
    foreground: "#09090B",

    card: "#FFFFFF",
    cardForeground: "#09090B",

    muted: "#F4F4F5",
    mutedForeground: "#71717A",

    border: "#E4E4E7",
    input: "#E4E4E7",

    primary: "#18181B",
    primaryForeground: "#FAFAFA",
    accent: "#6D28D9",

    destructive: "#DC2626",
    destructiveForeground: "#FFFFFF",

    success: "#16A34A",

    high: "#18181B",
    medium: "#52525B",
    low: "#A1A1AA",
  },

  dark: {
    background: "#09090B",
    foreground: "#FAFAFA",

    card: "#18181B",
    cardForeground: "#FAFAFA",

    muted: "#27272A",
    mutedForeground: "#A1A1AA",

    border: "#27272A",
    input: "#3F3F46",

    primary: "#FAFAFA",
    primaryForeground: "#18181B",
    accent: "#8B5CF6",

    destructive: "#EF4444",
    destructiveForeground: "#FFFFFF",

    success: "#22C55E",

    high: "#FAFAFA",
    medium: "#A1A1AA",
    low: "#71717A",
  },
} as const;

export type ThemeColors = typeof colors.light;
