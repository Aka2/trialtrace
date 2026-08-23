import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { signIn, signOut, fetchAuthSession, getCurrentUser } from 'aws-amplify/auth'

type AuthState = {
  isAuthenticated: boolean
  loading: boolean
  email: string | null
  role: 'data-manager' | 'auditor' | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [role, setRole] = useState<'data-manager' | 'auditor' | null>(null)

  const refresh = useCallback(async () => {
    try {
      const session = await fetchAuthSession()
      const groups = session.tokens?.accessToken?.payload['cognito:groups'] as string[] | undefined
      const user = await getCurrentUser()
      setIsAuthenticated(true)
      setEmail(user.signInDetails?.loginId ?? null)
      setRole(groups?.includes('auditor') ? 'auditor' : groups?.includes('data-manager') ? 'data-manager' : null)
    } catch {
      setIsAuthenticated(false)
      setRole(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = async (email: string, password: string) => {
    await signIn({ username: email, password })
    await refresh()
  }

  const logout = async () => {
    await signOut()
    setIsAuthenticated(false)
    setEmail(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, email, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}