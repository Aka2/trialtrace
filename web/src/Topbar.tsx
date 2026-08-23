import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function Topbar() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  return (
    <div className="topbar">
      <div className="study">
        <h1>{t('topbar.study')} <span className="code">SANOFI-2401</span> · {t('topbar.phase')}</h1>
        <p>{t('topbar.subtitle')}</p>
      </div>

      <button className="ask" onClick={() => navigate('/interroger')}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a7 7 0 0 0-7 7c0 2.4 1.2 4.5 3 5.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3c1.8-1.2 3-3.3 3-5.7a7 7 0 0 0-7-7z"/><path d="M9 21h6"/>
        </svg>
        {t('topbar.ask')}
      </button>

      <div className="lang-switch">
        <button className={i18n.language === 'fr' ? 'lang on' : 'lang'} onClick={() => i18n.changeLanguage('fr')}>FR</button>
        <button className={i18n.language === 'en' ? 'lang on' : 'lang'} onClick={() => i18n.changeLanguage('en')}>EN</button>
      </div>
    </div>
  )
}