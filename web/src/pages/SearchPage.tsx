import { useTranslation } from 'react-i18next'
import { SearchBar } from '../SearchBar'

export function SearchPage() {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="page-title">{t('search.title')}</h1>
      <SearchBar />
    </div>
  )
}