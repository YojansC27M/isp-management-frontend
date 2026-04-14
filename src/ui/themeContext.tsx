import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type ThemeMode = "system" | "light" | "dark"
type ResolvedTheme = "light" | "dark"

interface ThemeContextValue {
  themeMode: ThemeMode
  resolvedTheme: ResolvedTheme
  setThemeMode: (mode: ThemeMode) => void
  cycleThemeMode: () => void
}

const STORAGE_KEY = "corma-theme-mode"
const ThemeContext = createContext<ThemeContextValue | null>(null)

const getSystemTheme = (): ResolvedTheme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"

const getInitialMode = (): ThemeMode => {
  const storedTheme = window.localStorage.getItem(STORAGE_KEY)
  if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
    return storedTheme
  }
  return "system"
}

const applyThemeClass = (theme: ResolvedTheme) => {
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.documentElement.style.colorScheme = theme
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialMode)
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const onMediaQueryChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light")
    }

    mediaQuery.addEventListener("change", onMediaQueryChange)
    return () => mediaQuery.removeEventListener("change", onMediaQueryChange)
  }, [])

  const resolvedTheme = themeMode === "system" ? systemTheme : themeMode

  useEffect(() => {
    applyThemeClass(resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, themeMode)
  }, [themeMode])

  const cycleThemeMode = useCallback(() => {
    setThemeMode(resolvedTheme === "dark" ? "light" : "dark")
  }, [resolvedTheme])

  const value = useMemo(
    () => ({ themeMode, resolvedTheme, setThemeMode, cycleThemeMode }),
    [themeMode, resolvedTheme, cycleThemeMode]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}

