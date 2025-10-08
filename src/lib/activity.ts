/**
 * Activity Logging Utility
 * Handles logging of all job activities and updating lastActivityAt timestamp
 */

import { prisma } from "./prisma";
import { ActivityType } from "@prisma/client";

/**
 * Log an activity on a job and update lastActivityAt
 * Note: Viewing a job does NOT count as activity
 * 
 * @param jobId - ID of the job
 * @param userId - ID of the user performing the activity
 * @param type - Type of activity (from ActivityType enum)
 * @param description - Human-readable description of the activity
 * @param metadata - Optional additional data (JSON)
 */
export async function logActivity(
  jobId: string,
  userId: string,
  type: ActivityType,
  description: string,
  metadata?: Record<string, any>
): Promise<void> {
  const now = new Date();

  await prisma.$transaction([
    // Create activity record
    prisma.activity.create({
      data: {
        id: crypto.randomUUID(),
        jobId,
        userId,
        type,
        description,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        createdAt: now,
      },
    }),
    
    // Update job's lastActivityAt
    prisma.job.update({
      where: { id: jobId },
      data: { lastActivityAt: now },
    }),
  ]);
}

/**
 * Log job creation activity
 */
export async function logJobCreated(
  jobId: string,
  userId: string,
  clientName: string
): Promise<void> {
  await logActivity(
    jobId,
    userId,
    "CREATED",
    `Job created for client: ${clientName}`
  );
}

/**
 * Log job assignment activity
 */
export async function logJobAssigned(
  jobId: string,
  userId: string,
  assignedToName: string,
  assignedToId: string
): Promise<void> {
  await logActivity(
    jobId,
    userId,
    "ASSIGNED",
    `Job assigned to ${assignedToName}`,
    { assignedToId }
  );
}

/**
 * Log job reassignment activity
 */
export async function logJobReassigned(
  jobId: string,
  userId: string,
  previousAssigneeName: string,
  newAssigneeName: string,
  newAssigneeId: string
): Promise<void> {
  await logActivity(
    jobId,
    userId,
    "REASSIGNED",
    `Job reassigned from ${previousAssigneeName} to ${newAssigneeName}`,
    { previousAssignee: previousAssigneeName, newAssigneeId }
  );
}

/**
 * Log status change activity
 */
export async function logStatusChanged(
  jobId: string,
  userId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  await logActivity(
    jobId,
    userId,
    "STATUS_CHANGED",
    `Status changed from ${oldStatus} to ${newStatus}`,
    { oldStatus, newStatus }
  );
}

/**
 * Log comment added activity
 */
export async function logCommentAdded(
  jobId: string,
  userId: string,
  userName: string
): Promise<void> {
  await logActivity(
    jobId,
    userId,
    "COMMENT_ADDED",
    `${userName} added a comment`
  );
}

/**
 * Log file upload activity
 */
export async function logFileUploaded(
  jobId: string,
  userId: string,
  fileName: string
): Promise<void> {
  await logActivity(
    jobId,
    userId,
    "FILE_UPLOADED",
    `File uploaded: ${fileName}`,
    { fileName }
  );
}

/**
 * Log job completion activity
 */
export async function logJobCompleted(
  jobId: string,
  userId: string
): Promise<void> {
  await logActivity(
    jobId,
    userId,
    "COMPLETED",
    "Job marked as completed"
  );
}

/**
 * Log job cancellation activity
 */
export async function logJobCancelled(
  jobId: string,
  userId: string,
  reason?: string
): Promise<void> {
  await logActivity(
    jobId,
    userId,
    "CANCELLED",
    reason ? `Job cancelled: ${reason}` : "Job cancelled",
    reason ? { reason } : undefined
  );
}

/**
 * Log job update activity
 */
export async function logJobUpdated(
  jobId: string,
  userId: string,
  fieldsChanged: string[]
): Promise<void> {
  await logActivity(
    jobId,
    userId,
    "UPDATED",
    `Job updated: ${fieldsChanged.join(", ")}`,
    { fieldsChanged }
  );
}

/**
 * Log job snooze activity
 */
export async function logJobSnoozed(
  jobId: string,
  userId: string,
  snoozeUntil: Date
): Promise<void> {
  await logActivity(
    jobId,
    userId,
    "SNOOZED",
    `Reminders snoozed until ${snoozeUntil.toLocaleString()}`,
    { snoozeUntil: snoozeUntil.toISOString() }
  );
}

/**
 * Get recent activities for a job
 */
export async function getJobActivities(
  jobId: string,
  limit: number = 20
) {
  return await prisma.activity.findMany({
    where: { jobId },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get all activities for a user
 */
export async function getUserActivities(
  userId: string,
  limit: number = 50
) {
  return await prisma.activity.findMany({
    where: { userId },
    include: {
      Job: {
        select: {
          id: true,
          title: true,
          status: true,
          clientName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
