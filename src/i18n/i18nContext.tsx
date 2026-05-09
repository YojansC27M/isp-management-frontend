import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { LOCALE_STORAGE_KEY, getCurrentLocale, type Locale } from "@/i18n/locale"
import { translateWithLocale, translations } from "@/i18n/translations"

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(getCurrentLocale)
  const missingKeysRef = useRef(new Set<string>())

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale)
    }
  }, [])

  const toggleLocale = useCallback(() => {
    setLocale(locale === "es" ? "en" : "es")
  }, [locale, setLocale])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      if (!translations[locale][key] && !translations.es[key] && !missingKeysRef.current.has(key)) {
        missingKeysRef.current.add(key)
        console.warn(`[i18n] Missing translation key: ${key}`)
      }
      return translateWithLocale(locale, key, params)
    },
    [locale]
  )

  const value = useMemo(() => ({ locale, setLocale, toggleLocale, t }), [locale, setLocale, toggleLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return context
}
