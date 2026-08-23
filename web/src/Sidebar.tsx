import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from './auth/AuthContext'

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{children}</svg>
)

export function Sidebar() {
  const { t } = useTranslation()
  const { email, role, logout } = useAuth()

  const suivi = [
    { to: '/', end: true, label: t('nav.dashboard'),
      icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
    { to: '/ecarts', label: t('nav.deviations'), badge: 4,
      icon: <><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></> },
    { to: '/import', label: t('nav.reports'),
      icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></> },
    { to: '/protocole', label: t('nav.protocol'),
      icon: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></> },
    { to: '/recherche', label: t('nav.search'),
      icon: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></> },
  ]

  // Initiales à partir de l'email
  const initials = email ? email.slice(0, 2).toUpperCase() : '??'
  const roleLabel = role === 'auditor' ? t('role.auditor') : t('role.dataManager')

  return (
    <aside className="side">
      <div className="brand">
        <div className="brand-mark"><span></span></div>
        <div className="brand-name">TrialTrace<small>Data Review</small></div>
      </div>

      <div className="nav-label">{t('nav.suivi')}</div>
      <nav className="nav">
        {suivi.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon>{item.icon}</Icon>
            {item.label}
            {item.badge && <span className="badge">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="nav-label" style={{ marginTop: '26px' }}>{t('nav.administration')}</div>
      <nav className="nav">
        <NavLink to="/audit" className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon><path d="M12 2 3 7v6c0 5 3.8 8.5 9 10 5.2-1.5 9-5 9-10V7z"/></Icon>
          {t('nav.audit')}
        </NavLink>
      </nav>

      <div className="side-foot">
        <div className="avatar">{initials}</div>
        <div className="who">
          <b>{email}</b>
          <span>{roleLabel}</span>
        </div>
        <button className="logout-btn" onClick={logout} title={t('auth.logout')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>
          </svg>
        </button>
      </div>
    </aside>
  )
}