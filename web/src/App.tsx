import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { LoginPage } from './auth/LoginPage'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Dashboard } from './pages/Dashboard'
import { ImportPage } from './pages/ImportPage'
import { SearchPage } from './pages/SearchPage'
import { ProtocolPage } from './pages/ProtocolPage'
import { AskPage } from './pages/AskPage'
import './App.css'
import { useIdleTimeout } from './auth/useIdleTimeout'
import { AuditPage } from './pages/AuditPage'

function AppShell() {
  const { isAuthenticated, loading, logout } = useAuth()

  // Déconnexion auto après 15 min d'inactivité
  useIdleTimeout(() => {
    if (isAuthenticated) {
      logout()
      alert('Session expirée après inactivité. Veuillez vous reconnecter.')
    }
  }, 10)

  if (loading) return <div className="login-screen"><p style={{ color: '#fff' }}>Chargement…</p></div>
  if (!isAuthenticated) return <LoginPage />

  return (
    <BrowserRouter>
      <div className="layout">
        <Sidebar />
        <div className="main">
          <Topbar />
          <div className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/ecarts" element={<Dashboard />} />
              <Route path="/import" element={<ImportPage />} />
              <Route path="/recherche" element={<SearchPage />} />
              <Route path="/protocole" element={<ProtocolPage />} />
              <Route path="/interroger" element={<AskPage />} />
              <Route path="/audit" element={<AuditPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

export default App