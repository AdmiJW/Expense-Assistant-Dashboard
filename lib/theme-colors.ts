export const THEME_COLORS = [
  { id: "indigo", label: "靛藍", swatch: "#6366f1" },
  { id: "emerald", label: "翡翠", swatch: "#10b981" },
  { id: "sky", label: "天藍", swatch: "#0ea5e9" },
  { id: "rose", label: "玫瑰", swatch: "#f43f5e" },
  { id: "amber", label: "琥珀", swatch: "#f59e0b" },
  { id: "violet", label: "紫羅蘭", swatch: "#8b5cf6" },
] as const

export type ThemeColor = (typeof THEME_COLORS)[number]["id"]

export const DEFAULT_THEME_COLOR: ThemeColor = "indigo"

export function isThemeColor(value: string): value is ThemeColor {
  return THEME_COLORS.some((color) => color.id === value)
}

type ThemeColorVars = Record<string, string>

export const THEME_COLOR_VARIABLES: Record<
  ThemeColor,
  { light: ThemeColorVars; dark: ThemeColorVars }
> = {
  indigo: {
    light: {
      "--primary": "oklch(0.55 0.22 264)",
      "--primary-foreground": "oklch(0.98 0 0)",
      "--accent": "oklch(0.93 0.012 264)",
      "--accent-foreground": "oklch(0.25 0.08 264)",
      "--ring": "oklch(0.55 0.22 264)",
      "--chart-1": "oklch(0.55 0.22 264)",
      "--sidebar-accent": "oklch(0.28 0.04 264)",
    },
    dark: {
      "--primary": "oklch(0.65 0.20 264)",
      "--primary-foreground": "oklch(0.10 0 0)",
      "--accent": "oklch(0.28 0.04 264)",
      "--accent-foreground": "oklch(0.90 0.04 264)",
      "--ring": "oklch(0.65 0.20 264)",
      "--chart-1": "oklch(0.65 0.20 264)",
      "--sidebar-accent": "oklch(0.22 0.04 264)",
    },
  },
  emerald: {
    light: {
      "--primary": "oklch(0.58 0.16 162)",
      "--primary-foreground": "oklch(0.98 0 0)",
      "--accent": "oklch(0.94 0.035 162)",
      "--accent-foreground": "oklch(0.25 0.09 162)",
      "--ring": "oklch(0.58 0.16 162)",
      "--chart-1": "oklch(0.58 0.16 162)",
      "--sidebar-accent": "oklch(0.28 0.05 162)",
    },
    dark: {
      "--primary": "oklch(0.70 0.16 162)",
      "--primary-foreground": "oklch(0.10 0 0)",
      "--accent": "oklch(0.28 0.045 162)",
      "--accent-foreground": "oklch(0.90 0.05 162)",
      "--ring": "oklch(0.70 0.16 162)",
      "--chart-1": "oklch(0.70 0.16 162)",
      "--sidebar-accent": "oklch(0.22 0.05 162)",
    },
  },
  sky: {
    light: {
      "--primary": "oklch(0.60 0.16 240)",
      "--primary-foreground": "oklch(0.98 0 0)",
      "--accent": "oklch(0.94 0.035 240)",
      "--accent-foreground": "oklch(0.25 0.09 240)",
      "--ring": "oklch(0.60 0.16 240)",
      "--chart-1": "oklch(0.60 0.16 240)",
      "--sidebar-accent": "oklch(0.28 0.05 240)",
    },
    dark: {
      "--primary": "oklch(0.72 0.15 240)",
      "--primary-foreground": "oklch(0.10 0 0)",
      "--accent": "oklch(0.28 0.045 240)",
      "--accent-foreground": "oklch(0.90 0.05 240)",
      "--ring": "oklch(0.72 0.15 240)",
      "--chart-1": "oklch(0.72 0.15 240)",
      "--sidebar-accent": "oklch(0.22 0.05 240)",
    },
  },
  rose: {
    light: {
      "--primary": "oklch(0.60 0.22 15)",
      "--primary-foreground": "oklch(0.98 0 0)",
      "--accent": "oklch(0.94 0.04 15)",
      "--accent-foreground": "oklch(0.28 0.10 15)",
      "--ring": "oklch(0.60 0.22 15)",
      "--chart-1": "oklch(0.60 0.22 15)",
      "--sidebar-accent": "oklch(0.28 0.05 15)",
    },
    dark: {
      "--primary": "oklch(0.70 0.19 15)",
      "--primary-foreground": "oklch(0.10 0 0)",
      "--accent": "oklch(0.28 0.05 15)",
      "--accent-foreground": "oklch(0.90 0.05 15)",
      "--ring": "oklch(0.70 0.19 15)",
      "--chart-1": "oklch(0.70 0.19 15)",
      "--sidebar-accent": "oklch(0.22 0.05 15)",
    },
  },
  amber: {
    light: {
      "--primary": "oklch(0.70 0.17 75)",
      "--primary-foreground": "oklch(0.16 0.02 75)",
      "--accent": "oklch(0.95 0.05 75)",
      "--accent-foreground": "oklch(0.30 0.09 75)",
      "--ring": "oklch(0.70 0.17 75)",
      "--chart-1": "oklch(0.70 0.17 75)",
      "--sidebar-accent": "oklch(0.28 0.05 75)",
    },
    dark: {
      "--primary": "oklch(0.78 0.16 75)",
      "--primary-foreground": "oklch(0.14 0.02 75)",
      "--accent": "oklch(0.30 0.05 75)",
      "--accent-foreground": "oklch(0.92 0.06 75)",
      "--ring": "oklch(0.78 0.16 75)",
      "--chart-1": "oklch(0.78 0.16 75)",
      "--sidebar-accent": "oklch(0.22 0.05 75)",
    },
  },
  violet: {
    light: {
      "--primary": "oklch(0.58 0.22 300)",
      "--primary-foreground": "oklch(0.98 0 0)",
      "--accent": "oklch(0.94 0.04 300)",
      "--accent-foreground": "oklch(0.27 0.10 300)",
      "--ring": "oklch(0.58 0.22 300)",
      "--chart-1": "oklch(0.58 0.22 300)",
      "--sidebar-accent": "oklch(0.28 0.05 300)",
    },
    dark: {
      "--primary": "oklch(0.70 0.20 300)",
      "--primary-foreground": "oklch(0.10 0 0)",
      "--accent": "oklch(0.28 0.05 300)",
      "--accent-foreground": "oklch(0.90 0.05 300)",
      "--ring": "oklch(0.70 0.20 300)",
      "--chart-1": "oklch(0.70 0.20 300)",
      "--sidebar-accent": "oklch(0.22 0.05 300)",
    },
  },
}

const TAILWIND_ALIAS_VARIABLES: Record<string, string> = {
  "--primary": "--color-primary",
  "--primary-foreground": "--color-primary-foreground",
  "--accent": "--color-accent",
  "--accent-foreground": "--color-accent-foreground",
  "--ring": "--color-ring",
  "--chart-1": "--color-chart-1",
  "--sidebar-accent": "--color-sidebar-accent",
}

export function getThemeColorVariables(color: ThemeColor, dark: boolean): ThemeColorVars {
  const vars = THEME_COLOR_VARIABLES[color][dark ? "dark" : "light"]
  return {
    ...vars,
    ...Object.fromEntries(
      Object.entries(TAILWIND_ALIAS_VARIABLES).map(([source, alias]) => [
        alias,
        vars[source],
      ])
    ),
  }
}
