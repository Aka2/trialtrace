import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { DeviationsTable } from '../DeviationsTable'
import { apiFetch } from '../api'

type Stats = { total: number; conformes: number; mineures: number; critiques: number; ecarts: number }

export function Dashboard() {
  const { t } = useTranslation()
  const { data } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await apiFetch('/stats')
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })

  return (
    <div>
      <h1 className="page-title">{t('dashboard.title')}</h1>
      {data && (
        <div className="stats">
          <div className="stat neutral"><div className="rail" /><div className="k">{t('dashboard.reportsProcessed')}</div><div className="v">{data.total}</div><div className="d muted">{t('dashboard.visitsAnalyzed')}</div></div>
          <div className="stat ok"><div className="rail" /><div className="k">{t('dashboard.compliant')}</div><div className="v">{data.conformes}</div><div className="d ok-text">{Math.round((data.conformes / data.total) * 100)}{t('dashboard.ofReports')}</div></div>
          <div className="stat warn"><div className="rail" /><div className="k">{t('dashboard.minorDeviations')}</div><div className="v">{data.mineures}</div><div className="d warn-text">{t('dashboard.toReview')}</div></div>
          <div className="stat crit"><div className="rail" /><div className="k">{t('dashboard.criticalDeviations')}</div><div className="v">{data.critiques}</div><div className="d crit-text">{t('dashboard.actionRequired')}</div></div>
        </div>
      )}
      <DeviationsTable />
    </div>
  )
}