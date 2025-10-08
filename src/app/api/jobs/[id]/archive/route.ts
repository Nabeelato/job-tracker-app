import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canCompleteJob, canCancelJob } from "@/lib/permissions"
import { logJobCompleted, logJobCancelled, logCommentAdded } from "@/lib/activity"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get database user by email
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { action, reason } = body // action: "complete" or "cancel"

    // Check permissions based on action
    if (action === "complete" && !canCompleteJob(session.user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to complete jobs" },
        { status: 403 }
      )
    }

    if (action === "cancel" && !canCancelJob(session.user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to cancel jobs" },
        { status: 403 }
      )
    }

    // Get existing job
    const existingJob = await prisma.job.findUnique({
      where: { id: params.id },
    })

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Determine new status
    const newStatus = action === "complete" ? "COMPLETED" : "CANCELLED"
    const oldStatus = existingJob.status

    // Update job
    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        completedAt: new Date(),
      },
      include: {
        assignedTo: true,
        assignedBy: true,
        manager: true,
        supervisor: true,
        department: true,
      },
    })

    // Create status update entry
    await prisma.statusUpdate.create({
      data: {
        jobId: params.id,
        userId: dbUser.id,
        action: action === "complete" ? "JOB_COMPLETED" : "JOB_CANCELLED",
        oldValue: oldStatus,
        newValue: newStatus,
      },
    })

    // Log activity
    if (action === "complete") {
      await logJobCompleted(params.id, dbUser.id)
    } else {
      await logJobCancelled(params.id, dbUser.id, reason)
    }

    // Create optional comment with reason
    if (reason && reason.trim() !== "") {
      await prisma.comment.create({
        data: {
          content: `${action === "complete" ? "Completed" : "Cancelled"} by ${dbUser.name}. Reason: ${reason}`,
          jobId: params.id,
          userId: dbUser.id,
        },
      })

      // Create status update for comment
      await prisma.statusUpdate.create({
        data: {
          jobId: params.id,
          userId: dbUser.id,
          action: "COMMENT_ADDED",
          newValue: reason.substring(0, 100),
        },
      })

      // Log comment activity
      await logCommentAdded(params.id, dbUser.id, dbUser.name || "User")
    }

    // Notify relevant users
    const userIdsToNotify = new Set<string>([
      existingJob.assignedToId,
      existingJob.assignedById,
    ])
    if (existingJob.managerId) userIdsToNotify.add(existingJob.managerId)
    if (existingJob.supervisorId) userIdsToNotify.add(existingJob.supervisorId)
    
    // Remove the current user from notifications
    userIdsToNotify.delete(dbUser.id)

    // Create notifications
    for (const userId of Array.from(userIdsToNotify)) {
      await prisma.notification.create({
        data: {
          userId,
          type: "JOB_COMPLETED",
          title: `Job ${action === "complete" ? "Completed" : "Cancelled"}`,
          content: `"${existingJob.title}" has been ${action === "complete" ? "completed" : "cancelled"} by ${dbUser.name}`,
          jobId: params.id,
        },
      })
    }

    return NextResponse.json(updatedJob)
  } catch (error) {
    console.error("Error archiving job:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
