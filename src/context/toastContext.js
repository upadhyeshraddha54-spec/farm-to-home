import { createContext } from 'react'

// { success(message), error(message), info(message) } — see ToastProvider.
export const ToastContext = createContext(null)
