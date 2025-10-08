import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { extractMentions, createNotification } from "@/lib/notifications"
import { logCommentAdded } from "@/lib/activity"

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

    // Extract @mentions from content
    const mentions = extractMentions(content)

    const comment = await prisma.comment.create({
      data: {
        content,
        jobId: params.id,
        userId: dbUser.id,
        mentions: mentions,
      },
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

    // Log activity
    await logCommentAdded(params.id, dbUser.id, dbUser.name || "User")

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

    // Notify mentioned users
    for (const mentionedUserId of mentions) {
      if (mentionedUserId !== dbUser.id) {
        await createNotification({
          userId: mentionedUserId,
          type: "COMMENT_MENTION",
          title: "You were mentioned in a comment",
          content: `${dbUser.name} mentioned you in "${job?.title}": ${content.substring(0, 100)}`,
          jobId: params.id,
          commentId: comment.id,
          actionUrl: `/jobs/${params.id}`,
        })
      }
    }

    // Notify other job team members (who weren't mentioned)
    const notifyUserIds = [
      job?.assignedToId,
      job?.assignedById,
      job?.supervisorId,
      job?.managerId,
    ]
      .filter(id => id && id !== dbUser.id && !mentions.includes(id))

    for (const userId of notifyUserIds) {
      await createNotification({
        userId: userId!,
        type: "COMMENT_ADDED",
        title: "New comment on job",
        content: `${dbUser.name} commented on "${job?.title}"`,
        jobId: params.id,
        actionUrl: `/jobs/${params.id}`,
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
