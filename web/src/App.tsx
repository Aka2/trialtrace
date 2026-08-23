import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Dashboard } from './pages/Dashboard'
import { ImportPage } from './pages/ImportPage'
import { SearchPage } from './pages/SearchPage'
import { ProtocolPage } from './pages/ProtocolPage'
import { AskPage } from './pages/AskPage'
import './App.css'

function App() {
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
              <Route path="/audit" element={<div><h1 className="page-title">Piste d'audit</h1><p className="muted">À venir (étape 12).</p></div>} />
              <Route path="/interroger" element={<AskPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App