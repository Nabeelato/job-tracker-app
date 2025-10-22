import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
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

    const { message } = await request.json()
    const jobId = params.id

    // Get the job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        User_Job_assignedToIdToUser: true,
        User_Job_supervisorIdToUser: true,
        User_Job_managerIdToUser: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Only staff assigned to the job can request completion
    if (dbUser.role === "STAFF" && job.assignedToId !== dbUser.id) {
      return NextResponse.json(
        { error: "You can only request completion for jobs assigned to you" },
        { status: 403 }
      )
    }

    // Create a status update for the completion request
    await prisma.statusUpdate.create({
      data: {
        id: crypto.randomUUID(),
        jobId: job.id,
        userId: dbUser.id,
        action: "COMPLETION_REQUESTED",
        oldValue: job.status,
        newValue: "LAHORE_TO_PROCEED_CLIENT_INFO_COMPLETE",
      },
    })

    // Create a comment with the request message
    if (message) {
      await prisma.comment.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          jobId: job.id,
          userId: dbUser.id,
          content: `[Completion Request] ${message}`,
        },
      })
    }

    // Update job status to LAHORE_TO_PROCEED_CLIENT_INFO_COMPLETE
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "LAHORE_TO_PROCEED_CLIENT_INFO_COMPLETE",
      },
    })

    // TODO: Create notification for supervisor/manager

    return NextResponse.json({
      success: true,
      message: "Completion request submitted successfully",
      job: updatedJob,
    })
  } catch (error) {
    console.error("Error requesting job completion:", error)
    return NextResponse.json(
      { error: "Failed to request job completion" },
      { status: 500 }
    )
  }
}
