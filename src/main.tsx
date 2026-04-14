import React from 'react'
import ReactDOM from 'react-dom/client'
import "leaflet/dist/leaflet.css"
import App from './App'
import './index.css'

const THEME_STORAGE_KEY = "corma-theme-mode"
const storedThemeMode = window.localStorage.getItem(THEME_STORAGE_KEY)
const shouldUseDarkTheme =
  storedThemeMode === "dark" ||
  (storedThemeMode !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)

document.documentElement.classList.toggle("dark", shouldUseDarkTheme)
document.documentElement.style.colorScheme = shouldUseDarkTheme ? "dark" : "light"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
