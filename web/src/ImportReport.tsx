import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const API_URL = 'https://75n6uz51h9.execute-api.eu-west-1.amazonaws.com'

type ExtractResult =
  | { valid: true; data: Record<string, unknown> }
  | { error: string; details?: string[]; extracted?: Record<string, unknown> }

export function ImportReport() {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExtractResult | null>(null)

  const handleExtract = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`${API_URL}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const json = await res.json()
      setResult(json)
    } catch {
      setResult({ error: 'Erreur réseau' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="import-panel">
      <p className="hint">{t('import.hint')}</p>

      <textarea
        className="report-input"
        placeholder={t('import.placeholder')}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
      />

      <button className="extract-btn" onClick={handleExtract} disabled={loading || !text.trim()}>
        {loading ? t('import.extracting') : t('import.extract')}
      </button>

      {result && 'valid' in result && result.valid && (
        <div className="result ok">
          <strong>{t('import.validated')}</strong>
          <pre>{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      )}

      {result && 'error' in result && (
        <div className="result error">
          <strong>{t('import.invalid')}</strong>
          {result.details && (
            <ul>{result.details.map((d, i) => <li key={i}>{d}</li>)}</ul>
          )}
          {result.extracted && (
            <pre>{JSON.stringify(result.extracted, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  )
}