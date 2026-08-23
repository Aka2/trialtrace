import { useTranslation } from 'react-i18next'
import { ImportReport } from '../ImportReport'

export function ImportPage() {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="page-title">{t('import.title')}</h1>
      <ImportReport />
    </div>
  )
}