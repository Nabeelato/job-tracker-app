import { UserRole } from "@prisma/client"

// ============================================
// STAFF PERMISSIONS (Base Level)
// ============================================

export function canViewOwnJobs(role: UserRole): boolean {
  return true // All roles can view their own jobs
}

export function canUpdateJobStatus(role: UserRole): boolean {
  return true // All roles can update status
}

export function canLeaveComments(role: UserRole): boolean {
  return true // All roles can comment
}

export function canRequestCompletion(role: UserRole): boolean {
  return true // All roles can request completion (STAFF needs approval)
}

// ============================================
// SUPERVISOR PERMISSIONS (Staff + Assignment)
// ============================================

export function canViewDepartmentJobs(role: UserRole): boolean {
  return ["ADMIN", "MANAGER", "SUPERVISOR"].includes(role)
}

export function canAssignJobs(role: UserRole): boolean {
  return ["ADMIN", "MANAGER", "SUPERVISOR"].includes(role)
}

export function canApproveCompletion(role: UserRole): boolean {
  return ["ADMIN", "MANAGER", "SUPERVISOR"].includes(role)
}

// ============================================
// MANAGER PERMISSIONS (Full Job Management)
// ============================================

export function canCreateJobs(role: UserRole): boolean {
  return ["ADMIN", "MANAGER"].includes(role)
}

export function canEditJobDetails(role: UserRole): boolean {
  // ADMIN, MANAGER, and SUPERVISOR can edit job details (title, description, etc.)
  return ["ADMIN", "MANAGER", "SUPERVISOR"].includes(role)
}

export function canDeleteJobs(role: UserRole): boolean {
  return ["ADMIN", "MANAGER"].includes(role)
}

export function canCompleteJob(role: UserRole): boolean {
  // Managers and Admins can directly mark jobs as complete
  return ["ADMIN", "MANAGER", "SUPERVISOR"].includes(role)
}

export function canCancelJob(role: UserRole): boolean {
  // Only Managers and Admins can cancel jobs
  return ["ADMIN", "MANAGER"].includes(role)
}

export function canViewAllDepartmentJobs(role: UserRole): boolean {
  return ["ADMIN", "MANAGER"].includes(role)
}

// ============================================
// ADMIN PERMISSIONS (System Administration)
// ============================================

export function canManageUsers(role: UserRole): boolean {
  return role === "ADMIN"
}

export function canCreateUsers(role: UserRole): boolean {
  return role === "ADMIN"
}

export function canEditUsers(role: UserRole): boolean {
  return role === "ADMIN"
}

export function canResetPasswords(role: UserRole): boolean {
  return role === "ADMIN"
}

export function canDeleteUsers(role: UserRole): boolean {
  return role === "ADMIN"
}

export function canViewAllJobs(role: UserRole): boolean {
  return role === "ADMIN"
}

export function canManageDepartments(role: UserRole): boolean {
  return role === "ADMIN"
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function canReassignJob(role: UserRole): boolean {
  return ["ADMIN", "MANAGER", "SUPERVISOR"].includes(role)
}

export function needsApprovalToComplete(role: UserRole): boolean {
  // STAFF needs approval, others can mark complete directly
  return role === "STAFF"
}

export function canCommentOnJobs(role: UserRole): boolean {
  // All authenticated users can comment
  return true
}

export function getRoleName(role: UserRole): string {
  return role.charAt(0) + role.slice(1).toLowerCase()
}

export function getRoleColor(role: UserRole): string {
  const colors = {
    ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    MANAGER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    SUPERVISOR: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    STAFF: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  }
  return colors[role]
}
