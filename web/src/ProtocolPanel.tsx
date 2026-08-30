import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from './auth/AuthContext'
import { apiFetch } from './api'

type Protocol = { hemoglobinMin: number; hemoglobinMax: number; doseExpected: number; visitWindow: number }

export function ProtocolPanel() {
  const { t } = useTranslation()
  const { role } = useAuth()
  const canEdit = role === 'data-manager'
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    apiFetch('/protocol').then((r) => r.json()).then(setProtocol).catch(() => setMessage(t('deviations.loadError')))
  }, [t])

  const handleChange = (field: keyof Protocol, value: string) => {
    if (!protocol) return
    setProtocol({ ...protocol, [field]: Number(value) })
  }

  const handleSave = async () => {
    if (!protocol) return
    setSaving(true)
    setMessage('')
    try {
      const res = await apiFetch('/protocol', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(protocol),
      })
      if (!res.ok) {
        const err = await res.json()
        setMessage(err.error ?? 'Error')
      } else {
        setMessage(t('protocol.updated'))
        queryClient.invalidateQueries({ queryKey: ['deviations'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      }
    } catch {
      setMessage(t('deviations.loadError'))
    } finally {
      setSaving(false)
    }
  }

  if (!protocol) {
    return <div className="protocol-panel"><p className="muted">{message || t('deviations.loading')}</p></div>
  }

  return (
    <div className="protocol-panel">
      <p className="hint">{t('protocol.hint')}</p>
      <div className="protocol-grid">
        <div className="protocol-field">
          <label>{t('protocol.hbMin')}</label>
          <input type="number" step="0.1" value={protocol.hemoglobinMin} disabled={!canEdit} onChange={(e) => handleChange('hemoglobinMin', e.target.value)} />
        </div>
        <div className="protocol-field">
          <label>{t('protocol.hbMax')}</label>
          <input type="number" step="0.1" value={protocol.hemoglobinMax} disabled={!canEdit} onChange={(e) => handleChange('hemoglobinMax', e.target.value)} />
        </div>
        <div className="protocol-field">
          <label>{t('protocol.dose')}</label>
          <input type="number" value={protocol.doseExpected} disabled={!canEdit} onChange={(e) => handleChange('doseExpected', e.target.value)} />
        </div>
        <div className="protocol-field">
          <label>{t('protocol.window')}</label>
          <input type="number" value={protocol.visitWindow} disabled={!canEdit} onChange={(e) => handleChange('visitWindow', e.target.value)} />
        </div>
      </div>
      {canEdit ? (
        <button className="protocol-btn" onClick={handleSave} disabled={saving}>
          {saving ? t('protocol.saving') : t('protocol.save')}
        </button>
      ) : (
        <p className="readonly-notice">{t('protocol.readonly')}</p>
      )}
      {message && <p className="protocol-message">{message}</p>}
    </div>
  )
}