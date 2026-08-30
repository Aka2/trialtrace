import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiFetch } from './api'

type Participant = {
  subjectId: string
  site: string
  status: string
  inclusionDate: string
}

type Visit = {
  visitNumber: number
  hemoglobin: number
  dose: number
  plannedDay: number
  actualDay: number
  SK: string
}

type SubjectRow = {
  SK: string
  subjectId: string
  site?: string
  status?: string
  inclusionDate?: string
  visitNumber?: number
  hemoglobin?: number
  dose?: number
  plannedDay?: number
  actualDay?: number
}

export function SearchBar() {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // Détail participant (drawer)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Participant | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    setSearched(true)
    try {
      const res = await apiFetch(`/search?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      setResults(json.results ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const openDetail = async (id: string) => {
    setDetailId(id)
    setDetailLoading(true)
    setProfile(null)
    setVisits([])
    try {
      const res = await apiFetch(`/subjects/${id}`)
      const rows: SubjectRow[] = await res.json()

      // On sépare le profil des visites
      const profileRow = rows.find((r) => r.SK === 'PROFILE')
      const visitRows = rows
        .filter((r) => r.SK?.startsWith('VISIT#'))
        .sort((a, b) => (a.visitNumber ?? 0) - (b.visitNumber ?? 0))

      if (profileRow) {
        setProfile({
          subjectId: profileRow.subjectId,
          site: profileRow.site ?? '',
          status: profileRow.status ?? '',
          inclusionDate: profileRow.inclusionDate ?? '',
        })
      }
      setVisits(visitRows.map((v) => ({
        visitNumber: v.visitNumber ?? 0,
        hemoglobin: v.hemoglobin ?? 0,
        dose: v.dose ?? 0,
        plannedDay: v.plannedDay ?? 0,
        actualDay: v.actualDay ?? 0,
        SK: v.SK,
      })))
    } catch {
      // rien : on laisse le drawer afficher l'état vide
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="search-panel">
      <div className="search-row">
        <input
          className="search-input"
          placeholder={t('search.placeholder')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className="search-btn" onClick={handleSearch} disabled={loading}>
          {loading ? '…' : t('search.button')}
        </button>
      </div>

      {searched && !loading && (
        <p className="search-count">{t('search.results', { count: results.length })}</p>
      )}

      <div className="search-results">
        {results.map((p) => (
          <button key={p.subjectId} className="participant-row clickable" onClick={() => openDetail(p.subjectId)}>
            <span className="subject-id">{p.subjectId}</span>
            <span className="participant-meta">{p.site} · {p.status}</span>
          </button>
        ))}
      </div>

      {/* Drawer détail participant */}
      {detailId && (
        <>
          <div className="drawer-overlay" onClick={() => setDetailId(null)} />
          <div className="drawer">
            <div className="drawer-head">
              <h3>{t('subject.title')}</h3>
              <button className="drawer-close" onClick={() => setDetailId(null)}>✕</button>
            </div>

            <div className="drawer-body">
              {detailLoading && <p className="muted">{t('deviations.loading')}</p>}

              {!detailLoading && profile && (
                <>
                  <div className="drawer-field">
                    <span className="drawer-label">{t('deviations.participant')}</span>
                    <span className="drawer-value mono">{profile.subjectId}</span>
                  </div>
                  <div className="drawer-field">
                    <span className="drawer-label">{t('subject.site')}</span>
                    <span className="drawer-value">{profile.site}</span>
                  </div>
                  <div className="drawer-field">
                    <span className="drawer-label">{t('subject.status')}</span>
                    <span className="drawer-value">{profile.status}</span>
                  </div>
                  <div className="drawer-field">
                    <span className="drawer-label">{t('subject.inclusionDate')}</span>
                    <span className="drawer-value">{profile.inclusionDate}</span>
                  </div>

                  <div className="drawer-field">
                    <span className="drawer-label">{t('subject.visits')}</span>
                  </div>

                  <table className="visits-table">
                    <thead>
                      <tr>
                        <th>{t('subject.visit')}</th>
                        <th>{t('subject.hemoglobin')}</th>
                        <th>{t('subject.dose')}</th>
                        <th>{t('subject.day')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visits.map((v) => (
                        <tr key={v.SK}>
                          <td>{v.visitNumber}</td>
                          <td>{v.hemoglobin} g/dL</td>
                          <td>{v.dose} mg</td>
                          <td>J+{v.actualDay} <span className="muted">/ {v.plannedDay}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {!detailLoading && !profile && (
                <p className="muted">{t('subject.notFound')}</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}