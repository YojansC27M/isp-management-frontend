import AppRouter from './routes/AppRouter'
import { UIProvider } from "@/ui/uiContext"
import { ThemeProvider } from "@/ui/themeContext"
import { I18nProvider } from "@/i18n/i18nContext"

const App = () => {
  return (
    <I18nProvider>
      <ThemeProvider>
        <UIProvider>
          <AppRouter />
        </UIProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}

export default App
