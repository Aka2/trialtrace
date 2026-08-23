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

function AppShell() {
  const { isAuthenticated, loading } = useAuth()

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
              <Route path="/audit" element={<div><h1 className="page-title">Piste d'audit</h1><p className="muted">À venir.</p></div>} />
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