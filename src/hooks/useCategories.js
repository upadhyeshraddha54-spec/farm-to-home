import { useContext } from 'react'
import { CategoriesContext } from '../context/categoriesContext'

/** Returns { categories, activeCategories, loading, error }. */
export default function useCategories() {
  const context = useContext(CategoriesContext)
  if (!context) throw new Error('useCategories must be used inside <CategoriesProvider>.')
  return context
}
