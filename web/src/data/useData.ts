import { useContext } from 'react'
import { DataContext } from './context'

export function useData() {
  const context = useContext(DataContext)
  if (context === null) {
    throw new Error('useData doit être utilisé dans DataProvider.')
  }
  return context
}
