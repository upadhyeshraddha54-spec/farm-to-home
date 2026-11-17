import { isFirebaseConfigured, missingFirebaseEnv } from './config/firebase'
import AuthProvider from './context/AuthProvider'
import CartProvider from './context/CartProvider'
import CategoriesProvider from './context/CategoriesProvider'
import ToastProvider from './context/ToastProvider'
import SetupNotice from './pages/public/SetupNotice'
import AppRouter from './routes/AppRouter'

export default function App() {
  if (!isFirebaseConfigured) {
    return <SetupNotice missing={missingFirebaseEnv} />
  }

  return (
    <ToastProvider>
      <AuthProvider>
        <CategoriesProvider>
          <CartProvider>
            <AppRouter />
          </CartProvider>
        </CategoriesProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
