import { fetchAuthSession } from 'aws-amplify/auth'

const API_URL = 'https://75n6uz51h9.execute-api.eu-west-1.amazonaws.com'

async function getToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession()
    return session.tokens?.accessToken?.toString() ?? null
  } catch {
    return null
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(`${API_URL}${path}`, { ...options, headers })
}

export { API_URL }