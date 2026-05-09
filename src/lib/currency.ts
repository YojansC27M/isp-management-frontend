const normalizeCurrency = (currency?: string) => {
  const fallback = "COP"
  if (!currency) return fallback
  const normalized = currency.trim().toUpperCase()
  return /^[A-Z]{3}$/.test(normalized) ? normalized : fallback
}

export const formatCurrency = (value: number, currency?: string, locale = "es-CO") => {
  const safeCurrency = normalizeCurrency(currency)
  const useZeroDecimals = safeCurrency === "COP"
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: safeCurrency,
    minimumFractionDigits: useZeroDecimals ? 0 : 2,
    maximumFractionDigits: useZeroDecimals ? 0 : 2,
  })
  return formatter.format(value)
}
