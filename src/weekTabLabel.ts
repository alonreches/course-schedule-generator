import type { CourseWeek } from './types'

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function weekTabLabel(week: CourseWeek): string {
  if (week.days.length === 0) return `Week ${week.weekNumber}`

  const dates = week.days.map((d) => d.date).sort()
  const dateRange = `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}`

  const itemNames = week.days
    .flatMap((d) => d.circuits)
    .flatMap((c) => c.slots)
    .filter((s) => s.studentId && s.itemName)
    .map((s) => s.itemName)
    .sort()

  if (itemNames.length === 0) return dateRange

  const itemRange = `${itemNames[0]}–${itemNames[itemNames.length - 1]}`
  return `${dateRange}  ${itemRange}`
}
