import { useEffect, useState } from 'react'
import { getLanguage } from '../i18n'
import { loadFarmNames, loadProductNames } from '../services/nameService'

/**
 * Makes sure translated farm names (and, if given, product names) are loaded,
 * and re-renders once they arrive. Does nothing in English.
 * Use with getFarmName() / getProductName() from services/nameService.
 */
export default function useLocalizedNames(productIds = []) {
  const [, setVersion] = useState(0)
  const key = productIds.join(',')

  useEffect(() => {
    if (getLanguage() === 'en') return undefined
    let active = true
    const ids = key ? key.split(',') : []
    Promise.all([loadFarmNames(), loadProductNames(ids)]).then(() => {
      if (active) setVersion((v) => v + 1)
    })
    return () => {
      active = false
    }
  }, [key])
}
