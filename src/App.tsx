import AppRouter from './routes/AppRouter'
import { UIProvider } from "@/ui/uiContext"
import { ThemeProvider } from "@/ui/themeContext"

const App = () => {
  return (
    <ThemeProvider>
      <UIProvider>
        <AppRouter />
      </UIProvider>
    </ThemeProvider>
  )
}

export default App
