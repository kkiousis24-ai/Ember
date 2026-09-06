const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5020'

export interface BusinessGoal {
  id: string
  name: string
  goalType: string
  targetAmount: number
  currentAmount: number
  progressPercentage: number
  deadlineUtc: string | null
  notes: string | null
  currency: string
  isCompleted: boolean
  createdAtUtc: string
}

export interface SaveBusinessGoalInput {
  name: string
  goalType?: string
  targetAmount: number
  currentAmount?: number
  deadlineUtc?: string
  notes?: string
}

async function getErrorMessage(response: Response) {
  const data = await response.json().catch(() => null)

  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }

  return data?.title ?? data?.detail ?? 'Παρουσιάστηκε ένα σφάλμα.'
}

export async function getGoals(): Promise<BusinessGoal[]> {
  const response = await fetch(`${API_URL}/api/goals`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

export async function createGoal(
  input: SaveBusinessGoalInput,
): Promise<BusinessGoal> {
  const response = await fetch(`${API_URL}/api/goals`, {
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

export async function updateGoal(
  id: string,
  input: SaveBusinessGoalInput,
): Promise<BusinessGoal> {
  const response = await fetch(`${API_URL}/api/goals/${encodeURIComponent(id)}`, {
    method: 'PUT',
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

export async function addGoalContribution(
  id: string,
  amount: number,
): Promise<BusinessGoal> {
  const response = await fetch(
    `${API_URL}/api/goals/${encodeURIComponent(id)}/contributions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ amount }),
    },
  )

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

export async function deleteGoal(id: string) {
  const response = await fetch(`${API_URL}/api/goals/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok && response.status !== 404) {
    throw new Error(await getErrorMessage(response))
  }
}
