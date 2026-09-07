const API_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:5020'
).replace(/\/+$/, '')

// Matches MeetingStatus in backend/Models/Meeting.cs.
export type MeetingStatus = 1 | 2 | 3

export interface Meeting {
  id: string
  title: string
  startsAtUtc: string
  endsAtUtc: string
  location: string | null
  notes: string | null
  status: MeetingStatus
  createdAtUtc: string
}

export interface SaveMeetingInput {
  title: string
  // Convert local form dates with new Date(value).toISOString() before sending.
  startsAtUtc: string
  endsAtUtc: string
  location?: string | null
  notes?: string | null
  status: MeetingStatus
}

interface ApiProblem {
  errors?: Record<string, string[]>
  title?: string
  detail?: string
}

async function getErrorMessage(response: Response): Promise<string> {
  if (response.status === 401) {
    return 'Η σύνδεσή σου έληξε. Συνδέσου ξανά.'
  }

  const data: ApiProblem | null = await response.json().catch(() => null)

  if (data?.errors && typeof data.errors === 'object') {
    const message = Object.values(data.errors)
      .flat()
      .filter((item) => typeof item === 'string')
      .join(' ')

    if (message) return message
  }

  if (typeof data?.detail === 'string' && data.detail) return data.detail
  if (typeof data?.title === 'string' && data.title) return data.title

  if (response.status === 403) {
    return 'Δεν έχεις πρόσβαση στις συναντήσεις. Έλεγξε τη συνδρομή σου.'
  }

  if (response.status === 404) {
    return 'Η συνάντηση δεν βρέθηκε. Ανανέωσε τη λίστα.'
  }

  return 'Δεν ήταν δυνατή η ολοκλήρωση της ενέργειας. Δοκίμασε ξανά.'
}

async function sendRequest(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  try {
    return await fetch(`${API_URL}/api/meetings${path}`, {
      ...options,
      credentials: 'include',
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Δεν ήταν δυνατή η σύνδεση με τον διακομιστή. Δοκίμασε ξανά σε λίγο.',
      )
    }

    // Preserve cancellation so a page can ignore an aborted request.
    throw error
  }
}

export async function getMeetings(signal?: AbortSignal): Promise<Meeting[]> {
  const response = await sendRequest('', { signal })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

export async function getMeeting(
  id: string,
  signal?: AbortSignal,
): Promise<Meeting> {
  const response = await sendRequest(`/${encodeURIComponent(id)}`, { signal })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

export async function createMeeting(input: SaveMeetingInput): Promise<Meeting> {
  const response = await sendRequest('', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

export async function updateMeeting(
  id: string,
  input: SaveMeetingInput,
): Promise<Meeting> {
  const response = await sendRequest(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

export async function deleteMeeting(id: string): Promise<void> {
  const response = await sendRequest(`/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })

  // Removing an item that was already deleted also leaves the desired state.
  if (!response.ok && response.status !== 404) {
    throw new Error(await getErrorMessage(response))
  }
}
