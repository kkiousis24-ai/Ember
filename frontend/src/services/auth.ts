const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5020'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  plan: string
  trialEndsAtUtc: string
  subscriptionEndsAtUtc: string | null
  trialDaysRemaining: number
  hasActiveAccess: boolean
  preferredLanguage: string
  preferredTheme: string
}

async function getErrorMessage(response: Response) {
  const data = await response.json().catch(() => null)

  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }

  return data?.title ?? data?.detail ?? 'Παρουσιάστηκε ένα απρόβλεπτο σφάλμα.'
}

export async function register(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/login?useCookies=true`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    credentials: 'include',
  })

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

export async function logout() {
  const response = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok && response.status !== 401) {
    throw new Error(await getErrorMessage(response))
  }
}