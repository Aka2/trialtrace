import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { apiFetch } from '../api'

type AuditEntry = {
  timestamp: string
  actor: string
  action: string
  target: string
  details: string
}

const ACTION_LABEL: Record<string, string> = {
  PROTOCOL_UPDATED: 'Protocole modifié',
  QUERY_EMITTED: 'Query émise',
}

export function AuditPage() {
  const { t } = useTranslation()
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [actorFilter, setActorFilter] = useState<string>('all')

  const { data, isLoading } = useQuery<{ count: number; entries: AuditEntry[] }>({
    queryKey: ['audit'],
    queryFn: async () => {
      const res = await apiFetch('/audit')
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })

  const entries = data?.entries ?? []

  // Liste des utilisateurs uniques présents dans le journal (pour le menu déroulant)
  const actors = Array.from(new Set(entries.map((e) => e.actor)))

  // Filtrage côté front (type ET utilisateur)
  const filtered = entries.filter((e) => {
    const okAction = actionFilter === 'all' || e.action === actionFilter
    const okActor = actorFilter === 'all' || e.actor === actorFilter
    return okAction && okActor
  })

  return (
    <div>
      <h1 className="page-title">{t('nav.audit')}</h1>

      <div className="deviations-panel">
        <div className="deviations-head">
          <h2>{t('audit.title')}</h2>
          <span className="deviations-count">{t('audit.subtitle', { count: filtered.length })}</span>

          <div className="audit-filters">
            {/* Filtre par type d'action */}
            <div className="deviations-filters">
              <button className={actionFilter === 'all' ? 'chip on' : 'chip'} onClick={() => setActionFilter('all')}>{t('audit.allActions')}</button>
              <button className={actionFilter === 'PROTOCOL_UPDATED' ? 'chip on' : 'chip'} onClick={() => setActionFilter('PROTOCOL_UPDATED')}>{t('audit.protocolFilter')}</button>
              <button className={actionFilter === 'QUERY_EMITTED' ? 'chip on' : 'chip'} onClick={() => setActionFilter('QUERY_EMITTED')}>{t('audit.queryFilter')}</button>
            </div>

            {/* Filtre par utilisateur */}
            <select className="audit-select" value={actorFilter} onChange={(e) => setActorFilter(e.target.value)}>
              <option value="all">{t('audit.allUsers')}</option>
              {actors.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading && <p className="muted">{t('deviations.loading')}</p>}

        {data && filtered.length === 0 && (
          <p className="muted">{t('audit.empty')}</p>
        )}

        {filtered.length > 0 && (
          <table className="deviations-table">
            <thead>
              <tr>
                <th>{t('audit.when')}</th>
                <th>{t('audit.who')}</th>
                <th>{t('audit.what')}</th>
                <th>{t('audit.on')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={i}>
                  <td className="when-cell">{new Date(e.timestamp).toLocaleString()}</td>
                  <td className="dev-subject">{e.actor}</td>
                  <td className="dev-rule">
                    {ACTION_LABEL[e.action] ?? e.action}
                    <span className="dev-detail">{e.details}</span>
                  </td>
                  <td>{e.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}