import { useCallback, useMemo, useState } from 'react'
import { detectLanguage, setLanguage as applyLanguage } from '../i18n/core'
import { LanguageContext } from './languageContext'

/**
 * Holds the chosen language. The app below is keyed by language in App.jsx,
 * so switching re-renders every page in the new language.
 */
export default function LanguageProvider({ children }) {
  const [language, setState] = useState(() => {
    const initial = detectLanguage()
    applyLanguage(initial)
    return initial
  })

  const setLanguage = useCallback((code) => {
    applyLanguage(code)
    setState(code)
  }, [])

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
