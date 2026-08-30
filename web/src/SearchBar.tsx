import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiFetch } from './api'

type Participant = {
  subjectId: string
  site: string
  status: string
  inclusionDate: string
}

export function SearchBar() {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

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
          <div key={p.subjectId} className="participant-row">
            <span className="subject-id">{p.subjectId}</span>
            <span className="participant-meta">{p.site} · {p.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}