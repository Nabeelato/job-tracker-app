import { formatDistanceToNow, format, isPast, isFuture, isToday, differenceInDays } from "date-fns"

export function getRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatFullDate(date: Date | string): string {
  return format(new Date(date), "PPP")
}

export function formatFullDateTime(date: Date | string): string {
  return format(new Date(date), "PPp")
}

export function isOverdue(date: Date | string): boolean {
  return isPast(new Date(date))
}

export function isDueSoon(date: Date | string, days: number = 3): boolean {
  const dueDate = new Date(date)
  const daysUntilDue = differenceInDays(dueDate, new Date())
  return isFuture(dueDate) && daysUntilDue <= days
}

export function isDueToday(date: Date | string): boolean {
  return isToday(new Date(date))
}

export function getDueDateStatus(date: Date | string): {
  label: string
  color: string
  isOverdue: boolean
  isDueSoon: boolean
} {
  const dueDate = new Date(date)
  const now = new Date()
  const daysUntilDue = differenceInDays(dueDate, now)

  if (isPast(dueDate) && !isToday(dueDate)) {
    return {
      label: "Overdue",
      color: "text-red-600 dark:text-red-400",
      isOverdue: true,
      isDueSoon: false,
    }
  }

  if (isToday(dueDate)) {
    return {
      label: "Due Today",
      color: "text-orange-600 dark:text-orange-400",
      isOverdue: false,
      isDueSoon: true,
    }
  }

  if (daysUntilDue <= 3) {
    return {
      label: `Due in ${daysUntilDue} ${daysUntilDue === 1 ? "day" : "days"}`,
      color: "text-yellow-600 dark:text-yellow-400",
      isOverdue: false,
      isDueSoon: true,
    }
  }

  return {
    label: `Due in ${daysUntilDue} days`,
    color: "text-gray-600 dark:text-gray-400",
    isOverdue: false,
    isDueSoon: false,
  }
}

/**
 * Get month key in format "YYYY-MM" for grouping
 */
export function getMonthKey(date: Date | string): string {
  const d = new Date(date)
  return format(d, "yyyy-MM")
}

/**
 * Get formatted month label (e.g., "October 2025")
 */
export function getMonthLabel(date: Date | string): string {
  return format(new Date(date), "MMMM yyyy")
}

/**
 * Get formatted month label from key (e.g., "2025-10" -> "October 2025")
 */
export function getMonthLabelFromKey(monthKey: string): string {
  const [year, month] = monthKey.split("-")
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  return format(date, "MMMM yyyy")
}

/**
 * Group items by month based on a date field
 */
export function groupByMonth<T>(
  items: T[],
  dateField: keyof T
): Map<string, T[]> {
  const grouped = new Map<string, T[]>()

  items.forEach((item) => {
    const date = item[dateField]
    if (date) {
      const monthKey = getMonthKey(date as any)
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, [])
      }
      grouped.get(monthKey)!.push(item)
    }
  })

  // Sort by month (newest first)
  const sortedEntries = Array.from(grouped.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  return new Map(sortedEntries)
}

/**
 * Get list of available months from items
 */
export function getAvailableMonths<T>(
  items: T[],
  dateField: keyof T
): Array<{ key: string; label: string; count: number }> {
  const monthCounts = new Map<string, number>()

  items.forEach((item) => {
    const date = item[dateField]
    if (date) {
      const monthKey = getMonthKey(date as any)
      monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1)
    }
  })

  // Convert to array and sort by month (newest first)
  return Array.from(monthCounts.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, count]) => ({
      key,
      label: getMonthLabelFromKey(key),
      count,
    }))
}
