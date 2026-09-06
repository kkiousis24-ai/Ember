const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5020'

export interface Budget {
  id: string
  category: string
  limitAmount: number
  spentAmount: number
  remainingAmount: number
  progressPercentage: number
  month: number
  year: number
  currency: string
}

export interface SaveBudgetInput {
  category: string
  limitAmount: number
  month: number
  year: number
}

async function getErrorMessage(response: Response) {
  const data = await response.json().catch(() => null)

  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }

  return data?.title ?? data?.detail ?? 'Παρουσιάστηκε ένα σφάλμα.'
}

export async function getBudgets(): Promise<Budget[]> {
  const response = await fetch(`${API_URL}/api/budgets`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

export async function createBudget(
  input: SaveBudgetInput,
): Promise<Budget> {
  const response = await fetch(`${API_URL}/api/budgets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

export async function updateBudget(
  id: string,
  input: SaveBudgetInput,
): Promise<Budget> {
  const response = await fetch(
    `${API_URL}/api/budgets/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(input),
    },
  )

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

export async function deleteBudget(id: string) {
  const response = await fetch(
    `${API_URL}/api/budgets/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      credentials: 'include',
    },
  )

  if (!response.ok && response.status !== 404) {
    throw new Error(await getErrorMessage(response))
  }
}