import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiFetch } from '../api'

type Exchange = { question: string; answer: string; tool?: string | null }

export function AskPage() {
  const { t } = useTranslation()
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<Exchange[]>([])

  const suggestions = [
    t('ask.suggestion1'),
    t('ask.suggestion2'),
    t('ask.suggestion3'),
  ]

  const ask = async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    try {
      const res = await apiFetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const json = await res.json()
      setHistory((h) => [{ question: q, answer: json.answer, tool: json.tool }, ...h])
      setQuestion('')
    } catch {
      setHistory((h) => [{ question: q, answer: 'Erreur réseau.' }, ...h])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="page-title">{t('ask.title')}</h1>

      <div className="ask-panel">
        <p className="hint">{t('ask.hint')}</p>

        <div className="ask-row">
          <input
            className="ask-input"
            placeholder={t('ask.placeholder')}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask(question)}
          />
          <button className="ask-send" onClick={() => ask(question)} disabled={loading}>
            {loading ? '…' : t('ask.send')}
          </button>
        </div>

        <div className="ask-suggestions">
          {suggestions.map((s) => (
            <button key={s} className="ask-chip" onClick={() => ask(s)} disabled={loading}>{s}</button>
          ))}
        </div>
      </div>

      <div className="ask-history">
        {history.map((ex, i) => (
          <div key={i} className="ask-exchange">
            <div className="ask-q">{ex.question}</div>
            <div className="ask-a">{ex.answer}</div>
            {ex.tool && <div className="ask-tool">{t('ask.operation', { tool: ex.tool })}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}