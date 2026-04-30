"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import {
  DEFAULT_THEME_COLOR,
  getThemeColorVariables,
  isThemeColor,
  type ThemeColor,
} from "@/lib/theme-colors"

const STORAGE_KEY = "expense-dashboard-theme-color"

interface ThemeColorContextValue {
  color: ThemeColor
  setColor: (color: ThemeColor) => void
}

const ThemeColorContext = createContext<ThemeColorContextValue | null>(null)

function isDarkMode(root: HTMLElement) {
  if (root.classList.contains("dark")) return true
  if (root.classList.contains("light")) return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function applyThemeColor(color: ThemeColor) {
  const root = document.documentElement
  root.dataset.accentColor = color
  const vars = getThemeColorVariables(color, isDarkMode(root))
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value)
  }
}

export function ThemeColorProvider({ children }: { children: React.ReactNode }) {
  const [color, setColorState] = useState<ThemeColor>(DEFAULT_THEME_COLOR)

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    const nextColor = saved && isThemeColor(saved) ? saved : DEFAULT_THEME_COLOR
    if (nextColor !== color) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColorState(nextColor)
    }
    applyThemeColor(nextColor)

    const root = document.documentElement
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const observer = new MutationObserver(() => applyThemeColor(nextColor))
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })

    function handleSystemThemeChange() {
      applyThemeColor(nextColor)
    }
    media.addEventListener("change", handleSystemThemeChange)

    return () => {
      observer.disconnect()
      media.removeEventListener("change", handleSystemThemeChange)
    }
  }, [color])

  function setColor(nextColor: ThemeColor) {
    setColorState(nextColor)
    window.localStorage.setItem(STORAGE_KEY, nextColor)
    applyThemeColor(nextColor)
  }

  const value = useMemo(() => ({ color, setColor }), [color])

  return (
    <ThemeColorContext.Provider value={value}>
      {children}
    </ThemeColorContext.Provider>
  )
}

export function useThemeColor() {
  const context = useContext(ThemeColorContext)
  if (!context) {
    throw new Error("useThemeColor must be used inside ThemeColorProvider")
  }
  return context
}
