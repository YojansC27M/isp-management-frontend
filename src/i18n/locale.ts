export type Locale = "es" | "en"

export const LOCALE_STORAGE_KEY = "corma-locale"

export const normalizeLocale = (value: unknown): Locale | null => {
  if (value === "es" || value === "en") return value
  return null
}

export const getStoredLocale = (): Locale | null => {
  if (typeof window === "undefined") return null
  return normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY))
}

export const getBrowserLocale = (): Locale => {
  if (typeof navigator === "undefined") return "es"
  const language = navigator.language.toLowerCase()
  return language.startsWith("en") ? "en" : "es"
}

export const getCurrentLocale = (): Locale => getStoredLocale() ?? getBrowserLocale()

