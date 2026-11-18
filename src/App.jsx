import { isFirebaseConfigured, missingFirebaseEnv } from './config/firebase'
import AuthProvider from './context/AuthProvider'
import CartProvider from './context/CartProvider'
import CategoriesProvider from './context/CategoriesProvider'
import LanguageProvider from './context/LanguageProvider'
import ToastProvider from './context/ToastProvider'
import useLanguage from './hooks/useLanguage'
import SetupNotice from './pages/public/SetupNotice'
import AppRouter from './routes/AppRouter'

/**
 * Re-renders every page when the language changes. (Keying the router makes
 * React rebuild the page tree; sign-in, cart and categories live above it and
 * are kept.)
 */
function LocalizedRouter() {
  const { language } = useLanguage()
  return <AppRouter key={language} />
}

export default function App() {
  if (!isFirebaseConfigured) {
    return (
      <LanguageProvider>
        <SetupNotice missing={missingFirebaseEnv} />
      </LanguageProvider>
    )
  }

  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <CategoriesProvider>
            <CartProvider>
              <LocalizedRouter />
            </CartProvider>
          </CategoriesProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  )
}
