import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
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

    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      )
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        jobId: params.id,
        userId: dbUser.id,
      },
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
    })

    // Create a timeline entry for the comment
    await prisma.statusUpdate.create({
      data: {
        jobId: params.id,
        userId: dbUser.id,
        action: "COMMENT_ADDED",
        oldValue: null,
        newValue: content.substring(0, 100), // Store first 100 chars as preview
      },
    })

    // Get job details for notification
    const job = await prisma.job.findUnique({
      where: { id: params.id },
      select: {
        title: true,
        assignedToId: true,
        assignedById: true,
        supervisorId: true,
        managerId: true,
      },
    })

    // Notify all related users (except the commenter)
    const notifyUserIds = [
      job?.assignedToId,
      job?.assignedById,
      job?.supervisorId,
      job?.managerId,
    ]
      .filter(id => id && id !== dbUser.id)

    for (const userId of notifyUserIds) {
      await prisma.notification.create({
        data: {
          userId: userId!,
          type: "COMMENT_ADDED",
          title: "New comment on job",
          content: `${dbUser.name} commented on "${job?.title}"`,
          jobId: params.id,
        },
      })
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
