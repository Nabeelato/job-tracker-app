import { JobStatus } from "@prisma/client"

export function getStatusColor(status: JobStatus): string {
  const colors = {
    RFI_EMAIL_TO_CLIENT_SENT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    INFO_SENT_TO_LAHORE_JOB_STARTED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    MISSING_INFO_CHASE_CLIENT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    LAHORE_TO_PROCEED_CLIENT_INFO_COMPLETE: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    FOR_REVIEW_WITH_JACK: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  }
  return colors[status]
}

export function getStatusLabel(status: JobStatus): string {
  const labels = {
    RFI_EMAIL_TO_CLIENT_SENT: "02. RFI / Email to client sent",
    INFO_SENT_TO_LAHORE_JOB_STARTED: "03. Info sent to Lahore / Job started",
    MISSING_INFO_CHASE_CLIENT: "04. Missing info / Chase client",
    LAHORE_TO_PROCEED_CLIENT_INFO_COMPLETE: "05. Lahore to proceed / client Info complete",
    FOR_REVIEW_WITH_JACK: "06. For review with Jack",
    COMPLETED: "07. Completed",
    CANCELLED: "Cancelled",
  }
  return labels[status]
}

export function getPriorityColor(priority: string | null): string {
  if (!priority) return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  
  const upperPriority = priority.toUpperCase();
  if (upperPriority.includes("URGENT") || upperPriority.includes("HIGH")) {
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  }
  if (upperPriority.includes("NORMAL") || upperPriority.includes("MEDIUM")) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  }
  if (upperPriority.includes("LOW")) {
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
  return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
}

export function getPriorityLabel(priority: string | null): string {
  return priority || "Normal";
}

export function getNextStatus(currentStatus: JobStatus, userRole: string): JobStatus[] {
  const transitions: Record<JobStatus, JobStatus[]> = {
    RFI_EMAIL_TO_CLIENT_SENT: ["INFO_SENT_TO_LAHORE_JOB_STARTED", "CANCELLED"],
    INFO_SENT_TO_LAHORE_JOB_STARTED: ["MISSING_INFO_CHASE_CLIENT", "LAHORE_TO_PROCEED_CLIENT_INFO_COMPLETE", "CANCELLED"],
    MISSING_INFO_CHASE_CLIENT: ["INFO_SENT_TO_LAHORE_JOB_STARTED", "CANCELLED"],
    LAHORE_TO_PROCEED_CLIENT_INFO_COMPLETE: ["FOR_REVIEW_WITH_JACK", "CANCELLED"],
    FOR_REVIEW_WITH_JACK: ["COMPLETED", "INFO_SENT_TO_LAHORE_JOB_STARTED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  }
  
  // Only managers and supervisors can mark as COMPLETED
  const allowedTransitions = transitions[currentStatus] || []
  if (allowedTransitions.includes("COMPLETED" as JobStatus) && 
      userRole !== "MANAGER" && userRole !== "SUPERVISOR" && userRole !== "ADMIN") {
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
