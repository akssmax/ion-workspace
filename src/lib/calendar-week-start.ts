export function calendarWeekStart(language: string, preference?: string): number {
  if (preference === "sunday") return 0
  if (preference === "monday") return 1
  if (preference === "saturday") return 6

  try {
    return (new Intl.Locale(language) as Intl.Locale & { weekInfo: { firstDay: number } }).weekInfo.firstDay % 7
  } catch {
    return 1
  }
}
