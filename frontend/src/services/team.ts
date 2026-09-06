const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5020'

export type TeamRole = 'Admin' | 'Member'

export interface TeamMember {
  id: string
  email: string
  name: string | null
  role: TeamRole
  status: 'Pending' | 'Active'
  invitedAtUtc: string
}

export interface InviteTeamMemberInput {
  email: string
  name?: string
  role: TeamRole
}

async function getErrorMessage(response: Response) {
  const data = await response.json().catch(() => null)

  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }

  return data?.title ?? data?.detail ?? 'Παρουσιάστηκε ένα σφάλμα.'
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const response = await fetch(`${API_URL}/api/team`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

export async function inviteTeamMember(
  input: InviteTeamMemberInput,
): Promise<TeamMember> {
  const response = await fetch(`${API_URL}/api/team`, {
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

export async function updateTeamMemberRole(
  id: string,
  role: TeamRole,
): Promise<TeamMember> {
  const response = await fetch(
    `${API_URL}/api/team/${encodeURIComponent(id)}/role`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ role }),
    },
  )

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

export async function removeTeamMember(id: string) {
  const response = await fetch(`${API_URL}/api/team/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok && response.status !== 404) {
    throw new Error(await getErrorMessage(response))
  }
}
