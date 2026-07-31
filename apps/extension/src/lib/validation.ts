export const MAX_SESSION_NAME_LENGTH = 80

export function validateSessionName(value: string): string | null {
  const name = value.trim()
  if (!name) return "Enter a session name."
  if (name.length > MAX_SESSION_NAME_LENGTH) return `Keep the session name to ${MAX_SESSION_NAME_LENGTH} characters or fewer.`
  return null
}

export function validateSelectedTabs(tabIds: number[]): string | null {
  if (!tabIds.length) return "Select at least one tab to save."
  if (tabIds.some((id) => !Number.isInteger(id) || id < 0)) return "One or more selected tabs are invalid."
  return null
}
