import { useContext } from 'react'
import { ToastContext } from '../context/toastContext'

/** const toast = useToast(); toast.success('Saved') */
export default function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>.')
  return context
}
