import type { WeeklyStats } from "~/types/state"

export const validFocusDuration = (minutes: number) => Number.isFinite(minutes) && Number.isInteger(minutes) && minutes >= 1 && minutes <= 1440
export const remainingMs = (endsAt: number, now = Date.now()) => Math.max(0, endsAt - now)
function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
export function weekStart(timestamp = Date.now()): string { const d = new Date(timestamp); const day = (d.getDay() + 6) % 7; d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - day); return localDateKey(d) }
export function updateWeekly(rows: WeeklyStats[], timestamp: number, values: Partial<Omit<WeeklyStats, "weekStart">>): WeeklyStats[] {
  const key = weekStart(timestamp); const next = rows.map((r) => ({ ...r })); let row = next.find((r) => r.weekStart === key)
  if (!row) { row = { weekStart: key, completedFocusSessions: 0, totalFocusMinutes: 0, distractionsBlocked: 0 }; next.push(row) }
  row.completedFocusSessions += values.completedFocusSessions ?? 0; row.totalFocusMinutes += values.totalFocusMinutes ?? 0; row.distractionsBlocked += values.distractionsBlocked ?? 0
  return next.sort((a, b) => a.weekStart.localeCompare(b.weekStart)).slice(-12)
}
