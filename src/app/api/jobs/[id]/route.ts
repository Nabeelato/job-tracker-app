import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { canEditJobDetails, canDeleteJobs } from "@/lib/permissions"

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
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        department: true,
        comments: {
          include: {
            user: {
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
        statusUpdates: {
          include: {
            user: {
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
        attachments: true,
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

    return NextResponse.json(job)
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
        assignedTo: true,
        manager: true,
        supervisor: true,
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
    if (title) updateData.title = title
    if (description) updateData.description = description
    if (priority) updateData.priority = priority
    if (dueDate) updateData.dueDate = new Date(dueDate)
    if (tags) updateData.tags = tags
    if (status) updateData.status = status
    if (assignedToId) updateData.assignedToId = assignedToId
    if (managerId) updateData.managerId = managerId
    if (supervisorId) updateData.supervisorId = supervisorId

    // If marking as completed, set completedAt
    if (status === "COMPLETED" && existingJob.status !== "COMPLETED") {
      updateData.completedAt = new Date()
    }

    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignedTo: true,
        assignedBy: true,
        department: true,
      },
    })

    // Create timeline entries for assignment changes
    if (assignedToId && assignedToId !== existingJob.assignedToId) {
      const newStaff = await prisma.user.findUnique({ where: { id: assignedToId } })
      await prisma.statusUpdate.create({
        data: {
          jobId: params.id,
          userId: dbUser.id,
          action: "STAFF_ASSIGNED",
          oldValue: existingJob.assignedTo?.name || "None",
          newValue: newStaff?.name || "Unknown",
        },
      })

      // Notify new staff member
      if (assignedToId !== dbUser.id) {
        await prisma.notification.create({
          data: {
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
          jobId: params.id,
          userId: dbUser.id,
          action: "MANAGER_ASSIGNED",
          oldValue: existingJob.manager?.name || "None",
          newValue: newManager?.name || "Unknown",
        },
      })
    }

    if (supervisorId && supervisorId !== existingJob.supervisorId) {
      const newSupervisor = await prisma.user.findUnique({ where: { id: supervisorId } })
      await prisma.statusUpdate.create({
        data: {
          jobId: params.id,
          userId: dbUser.id,
          action: "SUPERVISOR_ASSIGNED",
          oldValue: existingJob.supervisor?.name || "None",
          newValue: newSupervisor?.name || "Unknown",
        },
      })
    }

    // Create status update if status changed
    if (status && status !== existingJob.status) {
      await prisma.statusUpdate.create({
        data: {
          jobId: params.id,
          userId: dbUser.id,
          action: "STATUS_CHANGED",
          oldValue: existingJob.status,
          newValue: status,
        },
      })

      // Notify assigned user about status change
      if (existingJob.assignedToId !== dbUser.id) {
        await prisma.notification.create({
          data: {
            userId: existingJob.assignedToId,
            type: "STATUS_CHANGED",
            title: "Job status updated",
            content: `"${existingJob.title}" status changed to ${status}`,
            jobId: params.id,
          },
        })
      }
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
