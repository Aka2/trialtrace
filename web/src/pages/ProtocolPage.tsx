import { useTranslation } from 'react-i18next'
import { ProtocolPanel } from '../ProtocolPanel'

export function ProtocolPage() {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="page-title">{t('protocol.title')}</h1>
      <ProtocolPanel />
    </div>
  )
}