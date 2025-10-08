import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

// PATCH - Update job progress
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { progress } = body

    if (progress === undefined || progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: "Progress must be between 0 and 100" },
        { status: 400 }
      )
    }

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        User_Job_assignedToIdToUser: true,
        User_Job_managerIdToUser: true,
        User_Job_supervisorIdToUser: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const oldProgress = job.progress

    const updated = await prisma.job.update({
      where: { id: params.id },
      data: { progress },
    })

    // Create status update
    await prisma.statusUpdate.create({
      data: {
        id: crypto.randomUUID(),
        jobId: params.id,
        userId: dbUser.id,
        action: "PROGRESS_UPDATED",
        oldValue: oldProgress.toString(),
        newValue: progress.toString(),
      },
    })

    // Notify supervisor and manager of progress milestones
    if (progress >= 50 && oldProgress < 50) {
      // Notify when 50% complete
      const notifyIds = [job.managerId, job.supervisorId].filter(Boolean)
      for (const userId of notifyIds) {
        await createNotification({
          userId: userId!,
          type: "PROGRESS_UPDATE",
          title: "Job is 50% complete",
          content: `${dbUser.name} updated "${job.title}" to 50% progress`,
          jobId: params.id,
          actionUrl: `/jobs/${params.id}`,
        })
      }
    }

    if (progress === 100 && oldProgress < 100) {
      // Notify when 100% complete
      const notifyIds = [job.managerId, job.supervisorId].filter(Boolean)
      for (const userId of notifyIds) {
        await createNotification({
          userId: userId!,
          type: "PROGRESS_UPDATE",
          title: "Job marked as 100% complete",
          content: `${dbUser.name} marked "${job.title}" as 100% complete`,
          jobId: params.id,
          actionUrl: `/jobs/${params.id}`,
        })
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating progress:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
