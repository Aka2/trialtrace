import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from './auth/AuthContext'
import { apiFetch } from './api'

type Deviation = {
  subjectId: string
  visitNumber: number
  type: string
  severity: 'critical' | 'minor'
  detail: string
}

type Filter = 'all' | 'critical' | 'minor'

const TYPE_KEY: Record<string, string> = {
  HEMOGLOBIN_OUT_OF_RANGE: 'deviations.typeHemoglobin',
  VISIT_OUT_OF_WINDOW: 'deviations.typeVisit',
  DOSE_MISMATCH: 'deviations.typeDose',
}

export function DeviationsTable() {
  const { t } = useTranslation()
  const { role } = useAuth()
  const canAct = role === 'data-manager'
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Deviation | null>(null)

  const { data, isLoading, error } = useQuery<{ count: number; deviations: Deviation[] }>({
    queryKey: ['deviations'],
    queryFn: async () => {
      const res = await apiFetch('/deviations')
      if (!res.ok) throw new Error('Erreur réseau')
      return res.json()
    },
  })

  const filtered = data?.deviations.filter((d) => {
    if (filter === 'all') return true
    return d.severity === filter
  }) ?? []

  return (
    <div className="deviations-panel">
      <div className="deviations-head">
        <h2>{t('deviations.title')}</h2>
        <span className="deviations-count">{t('deviations.resultsSorted', { count: filtered.length })}</span>
        <div className="deviations-filters">
          <button className={filter === 'all' ? 'chip on' : 'chip'} onClick={() => setFilter('all')}>{t('deviations.all')}</button>
          <button className={filter === 'critical' ? 'chip on' : 'chip'} onClick={() => setFilter('critical')}>{t('deviations.critical')}</button>
          <button className={filter === 'minor' ? 'chip on' : 'chip'} onClick={() => setFilter('minor')}>{t('deviations.minor')}</button>
        </div>
      </div>

      {isLoading && <p className="muted">{t('deviations.loading')}</p>}
      {error && <p className="muted">{t('deviations.loadError')}</p>}

      {data && (
        <table className="deviations-table">
          <thead>
            <tr>
              <th>{t('deviations.participant')}</th>
              <th>{t('deviations.rule')}</th>
              <th>{t('deviations.status')}</th>
              <th>{t('deviations.action')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr key={i}>
                <td className="dev-subject">{d.subjectId}<span className="dev-visit">{t('deviations.visit', { n: d.visitNumber })}</span></td>
                <td className="dev-rule">
                  {t(TYPE_KEY[d.type] ?? '')}
                  <span className="dev-detail">{d.detail}</span>
                </td>
                <td>
                  <span className={`dev-tag ${d.severity}`}>
                    {d.severity === 'critical' ? t('deviations.criticalTag') : t('deviations.minorTag')}
                  </span>
                </td>
                <td>
                  <button className="dev-action" onClick={() => setSelected(d)}>
                    {d.severity === 'critical' ? t('deviations.emitQuery') : t('deviations.examine')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <>
          <div className="drawer-overlay" onClick={() => setSelected(null)} />
          <div className="drawer">
            <div className="drawer-head">
              <h3>{t('deviations.detailTitle')}</h3>
              <button className="drawer-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="drawer-body">
              <div className="drawer-field">
                <span className="drawer-label">{t('deviations.participant')}</span>
                <span className="drawer-value mono">{selected.subjectId}</span>
              </div>
              <div className="drawer-field">
                <span className="drawer-label">{t('deviations.visitLabel')}</span>
                <span className="drawer-value">{t('deviations.visit', { n: selected.visitNumber })}</span>
              </div>
              <div className="drawer-field">
                <span className="drawer-label">{t('deviations.rule')}</span>
                <span className="drawer-value">{t(TYPE_KEY[selected.type] ?? '')}</span>
              </div>
              <div className="drawer-field">
                <span className="drawer-label">{t('deviations.detailLabel')}</span>
                <span className="drawer-value">{selected.detail}</span>
              </div>
              <div className="drawer-field">
                <span className="drawer-label">{t('deviations.severityLabel')}</span>
                <span className={`dev-tag ${selected.severity}`}>
                  {selected.severity === 'critical' ? t('deviations.criticalTag') : t('deviations.minorTag')}
                </span>
              </div>
            </div>

            {canAct ? (
              <div className="drawer-actions">
                <button className="drawer-btn primary" onClick={() => { alert(t('deviations.queryEmitted')); setSelected(null) }}>
                  {t('deviations.emitQueryBtn')}
                </button>
                <button className="drawer-btn" onClick={() => { alert(t('deviations.markedReviewed')); setSelected(null) }}>
                  {t('deviations.markReviewed')}
                </button>
              </div>
            ) : (
              <div className="drawer-actions">
                <p className="readonly-notice">{t('deviations.readonly')}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}