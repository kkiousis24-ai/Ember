const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5020'

export type TransactionType = 1 | 2

export interface Transaction {
  id: string
  description: string
  amount: number
  type: TransactionType
  category: string
  occurredAtUtc: string
  currency: string
  isRecurring: boolean
}

export interface CreateTransactionInput {
  description: string
  amount: number
  type: TransactionType
  category?: string
  occurredAtUtc?: string
  isRecurring?: boolean
}

export interface UpdateTransactionInput {
  description: string
  amount: number
  type: TransactionType
  category?: string
  occurredAtUtc?: string
  isRecurring?: boolean
}

async function getErrorMessage(response: Response) {
  const data = await response.json().catch(() => null)

  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }

  return data?.title ?? data?.detail ?? 'Παρουσιάστηκε ένα σφάλμα.'
}

export async function getTransactions(): Promise<Transaction[]> {
  const response = await fetch(`${API_URL}/api/transactions`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<Transaction> {
  const response = await fetch(`${API_URL}/api/transactions`, {
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

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  const response = await fetch(
    `${API_URL}/api/transactions/${encodeURIComponent(id)}`,
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

export async function deleteTransaction(id: string) {
  const response = await fetch(`${API_URL}/api/transactions/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok && response.status !== 404) {
    throw new Error(await getErrorMessage(response))
  }
}