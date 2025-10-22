// Utility functions for job status display and mapping

export type JobStatus =
  | "RFI_EMAIL_TO_CLIENT_SENT"
  | "INFO_SENT_TO_LAHORE_JOB_STARTED"
  | "MISSING_INFO_CHASE_CLIENT"
  | "LAHORE_TO_PROCEED_CLIENT_INFO_COMPLETE"
  | "FOR_REVIEW_WITH_JACK"
  | "COMPLETED"
  | "CANCELLED";

// Convert status enum to display label
export function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    RFI_EMAIL_TO_CLIENT_SENT: "02. RFI / Email to client sent",
    INFO_SENT_TO_LAHORE_JOB_STARTED: "03. Info sent to Lahore / Job started",
    MISSING_INFO_CHASE_CLIENT: "04. Missing info / Chase client",
    LAHORE_TO_PROCEED_CLIENT_INFO_COMPLETE: "05. Lahore to proceed / client Info complete",
    FOR_REVIEW_WITH_JACK: "06. For review with Jack",
    COMPLETED: "07. Completed",
    CANCELLED: "Cancelled",
  };

  return statusLabels[status] || status;
}

// Get status color for badges
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    RFI_EMAIL_TO_CLIENT_SENT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    INFO_SENT_TO_LAHORE_JOB_STARTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    MISSING_INFO_CHASE_CLIENT: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    LAHORE_TO_PROCEED_CLIENT_INFO_COMPLETE: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    FOR_REVIEW_WITH_JACK: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  };

  return colors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
}

// Get all status options for dropdowns
export function getAllStatuses() {
  return [
    { value: "RFI_EMAIL_TO_CLIENT_SENT", label: "02. RFI / Email to client sent" },
    { value: "INFO_SENT_TO_LAHORE_JOB_STARTED", label: "03. Info sent to Lahore / Job started" },
    { value: "MISSING_INFO_CHASE_CLIENT", label: "04. Missing info / Chase client" },
    { value: "LAHORE_TO_PROCEED_CLIENT_INFO_COMPLETE", label: "05. Lahore to proceed / client Info complete" },
    { value: "FOR_REVIEW_WITH_JACK", label: "06. For review with Jack" },
    { value: "COMPLETED", label: "07. Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ];
}
