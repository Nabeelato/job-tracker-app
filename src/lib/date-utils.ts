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
