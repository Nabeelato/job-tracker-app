import { JobStatus, Priority } from "@prisma/client"

export function getStatusColor(status: JobStatus): string {
  const colors = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    ON_HOLD: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    AWAITING_APPROVAL: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    PENDING_COMPLETION: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  }
  return colors[status]
}

export function getStatusLabel(status: JobStatus): string {
  const labels = {
    PENDING: "02: RFI",
    IN_PROGRESS: "03: Info Sent to Lahore",
    ON_HOLD: "04: Missing Info / Chase Info",
    AWAITING_APPROVAL: "05: Info Completed",
    PENDING_COMPLETION: "06: Sent to Jack for Review",
    COMPLETED: "07: Completed",
    CANCELLED: "Cancelled",
  }
  return labels[status]
}

export function getPriorityColor(priority: Priority): string {
  const colors = {
    LOW: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    NORMAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  }
  return colors[priority]
}

export function getPriorityLabel(priority: Priority): string {
  return priority.charAt(0) + priority.slice(1).toLowerCase()
}

export function getNextStatus(currentStatus: JobStatus, userRole: string): JobStatus[] {
  const transitions: Record<JobStatus, JobStatus[]> = {
    PENDING: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["ON_HOLD", "AWAITING_APPROVAL", "CANCELLED"],
    ON_HOLD: ["IN_PROGRESS", "CANCELLED"],
    AWAITING_APPROVAL: ["IN_PROGRESS", "PENDING_COMPLETION", "CANCELLED"],
    PENDING_COMPLETION: ["COMPLETED", "IN_PROGRESS", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  }
  
  // Only managers and supervisors can mark as COMPLETED
  const allowedTransitions = transitions[currentStatus] || []
  if (allowedTransitions.includes("COMPLETED" as JobStatus) && 
      userRole !== "MANAGER" && userRole !== "SUPERVISOR") {
    return allowedTransitions.filter(status => status !== "COMPLETED")
  }
  
  return allowedTransitions
}

export function canTransitionStatus(
  from: JobStatus,
  to: JobStatus,
  userRole: string
): boolean {
  const allowedTransitions = getNextStatus(from, userRole)
  return allowedTransitions.includes(to)
}
