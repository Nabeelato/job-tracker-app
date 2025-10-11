import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canEditJobDetails, canDeleteJobs } from "@/lib/permissions"
import { logStatusChanged, logJobUpdated, logJobCompleted, logJobReassigned } from "@/lib/activity"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        User_Job_assignedToIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        User_Job_assignedByIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        User_Job_managerIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        User_Job_supervisorIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Department: true,
        Comment: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        StatusUpdate: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            timestamp: "asc",
          },
        },
        Attachment: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Check if user can view this job
    if (
      session.user.role === "STAFF" &&
      job.assignedToId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You don't have permission to view this job" },
        { status: 403 }
      )
    }

    // Transform Prisma relation names to frontend-friendly names
    const transformedJob = {
      ...job,
      assignedTo: job.User_Job_assignedToIdToUser,
      assignedBy: job.User_Job_assignedByIdToUser,
      manager: job.User_Job_managerIdToUser || null,
      supervisor: job.User_Job_supervisorIdToUser || null,
      department: job.Department,
      comments: job.Comment?.map((comment: any) => ({
        ...comment,
        user: comment.User,
      })) || [],
      statusUpdates: job.StatusUpdate
        ?.filter((update: any) => update.action === "STATUS_CHANGED") // Only show actual status changes
        ?.map((update: any) => ({
          id: update.id,
          oldStatus: update.oldValue,
          newStatus: update.newValue,
          createdAt: update.timestamp,
          user: update.User,
        })) || [],
    };

    return NextResponse.json(transformedJob)
  } catch (error) {
    console.error("Error fetching job:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the actual database user by email
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
    const { title, description, priority, dueDate, status, tags, assignedToId, managerId, supervisorId } = body

    const existingJob = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        User_Job_assignedToIdToUser: true,
        User_Job_managerIdToUser: true,
        User_Job_supervisorIdToUser: true,
      },
    })

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Check permissions for editing details vs status
    const isEditingDetails = title || description || priority || dueDate || tags || assignedToId || managerId || supervisorId
    if (isEditingDetails && !canEditJobDetails(session.user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to edit job details" },
        { status: 403 }
      )
    }

    // Supervisors can only change staff assignments, not manager or supervisor
    if (session.user.role === "SUPERVISOR") {
      if (managerId && managerId !== existingJob.managerId) {
        return NextResponse.json(
          { error: "Supervisors cannot change the manager assignment" },
          { status: 403 }
        )
      }
      if (supervisorId && supervisorId !== existingJob.supervisorId) {
        return NextResponse.json(
          { error: "Supervisors cannot change the supervisor assignment" },
          { status: 403 }
        )
      }
    }

    const updateData: any = {}
    const fieldsChanged: string[] = []
    
    if (title && title !== existingJob.title) {
      updateData.title = title
      fieldsChanged.push("title")
    }
    if (description && description !== existingJob.description) {
      updateData.description = description
      fieldsChanged.push("description")
    }
    if (priority && priority !== existingJob.priority) {
      updateData.priority = priority
      fieldsChanged.push("priority")
    }
    if (dueDate) {
      updateData.dueDate = new Date(dueDate)
      fieldsChanged.push("due date")
    }
    if (tags) {
      updateData.tags = tags
      fieldsChanged.push("tags")
    }
    if (status && status !== existingJob.status) {
      // Permission check: STAFF cannot directly mark jobs as COMPLETED or CANCELLED
      if (session.user.role === "STAFF") {
        if (status === "COMPLETED" || status === "CANCELLED") {
          return NextResponse.json(
            { 
              error: "Staff members cannot directly mark jobs as completed or cancelled. Please use 'Sent to Jack for Review' status to request completion approval from your supervisor or manager." 
            },
            { status: 403 }
          )
        }
      }
      
      updateData.status = status
      fieldsChanged.push("status")
    }
    if (assignedToId && assignedToId !== existingJob.assignedToId) {
      updateData.assignedToId = assignedToId
      fieldsChanged.push("assigned to")
    }
    if (managerId && managerId !== existingJob.managerId) {
      updateData.managerId = managerId
      fieldsChanged.push("manager")
    }
    if (supervisorId && supervisorId !== existingJob.supervisorId) {
      updateData.supervisorId = supervisorId
      fieldsChanged.push("supervisor")
    }

    // If marking as completed, set completedAt
    if (status === "COMPLETED" && existingJob.status !== "COMPLETED") {
      updateData.completedAt = new Date()
    }

    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: updateData,
      include: {
        User_Job_assignedToIdToUser: true,
        User_Job_assignedByIdToUser: true,
        Department: true,
      },
    })

    // Create timeline entries for assignment changes
    if (assignedToId && assignedToId !== existingJob.assignedToId) {
      const newStaff = await prisma.user.findUnique({ where: { id: assignedToId } })
      await prisma.statusUpdate.create({
        data: {
          id: crypto.randomUUID(),
          jobId: params.id,
          userId: dbUser.id,
          action: "STAFF_ASSIGNED",
          oldValue: existingJob.User_Job_assignedToIdToUser?.name || "None",
          newValue: newStaff?.name || "Unknown",
        },
      })

      // Log activity
      const previousAssigneeName = existingJob.User_Job_assignedToIdToUser?.name || "Unassigned"
      await logJobReassigned(params.id, dbUser.id, previousAssigneeName, newStaff?.name || "Staff", assignedToId)

      // Notify new staff member
      if (assignedToId !== dbUser.id) {
        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: assignedToId,
            type: "JOB_ASSIGNED",
            title: "Job assigned to you",
            content: `You have been assigned to job ${existingJob.jobId}`,
            jobId: params.id,
          },
        })
      }
    }

    if (managerId && managerId !== existingJob.managerId) {
      const newManager = await prisma.user.findUnique({ where: { id: managerId } })
      await prisma.statusUpdate.create({
        data: {
          id: crypto.randomUUID(),
          jobId: params.id,
          userId: dbUser.id,
          action: "MANAGER_ASSIGNED",
          oldValue: existingJob.User_Job_managerIdToUser?.name || "None",
          newValue: newManager?.name || "Unknown",
        },
      })
    }

    if (supervisorId && supervisorId !== existingJob.supervisorId) {
      const newSupervisor = await prisma.user.findUnique({ where: { id: supervisorId } })
      await prisma.statusUpdate.create({
        data: {
          id: crypto.randomUUID(),
          jobId: params.id,
          userId: dbUser.id,
          action: "SUPERVISOR_ASSIGNED",
          oldValue: existingJob.User_Job_supervisorIdToUser?.name || "None",
          newValue: newSupervisor?.name || "Unknown",
        },
      })
    }

    // Create status update if status changed
    if (status && status !== existingJob.status) {
      await prisma.statusUpdate.create({
        data: {
          id: crypto.randomUUID(),
          jobId: params.id,
          userId: dbUser.id,
          action: "STATUS_CHANGED",
          oldValue: existingJob.status,
          newValue: status,
        },
      })

      // Log activity
      await logStatusChanged(params.id, dbUser.id, existingJob.status, status)
      
      // If completed, log completion
      if (status === "COMPLETED") {
        await logJobCompleted(params.id, dbUser.id)
      }

      // Notify assigned user about status change
      if (existingJob.assignedToId !== dbUser.id) {
        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: existingJob.assignedToId,
            type: "JOB_STATUS_CHANGED",
            title: "Job status updated",
            content: `"${existingJob.title}" status changed to ${status}`,
            jobId: params.id,
          },
        })
      }
    }

    // Log other field updates
    if (fieldsChanged.length > 0 && !status) {
      await logJobUpdated(params.id, dbUser.id, fieldsChanged)
    }

    return NextResponse.json(updatedJob)
  } catch (error) {
    console.error("Error updating job:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!canDeleteJobs(session.user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to delete jobs" },
        { status: 403 }
      )
    }

    await prisma.job.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Job deleted successfully" })
  } catch (error) {
    console.error("Error deleting job:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
