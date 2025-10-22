import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const jobId = params.id

    // Get status updates and comments for the job
    const [statusUpdates, comments] = await Promise.all([
      prisma.statusUpdate.findMany({
        where: { jobId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
      }),
      prisma.comment.findMany({
        where: { jobId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ])

    // Format status updates
    const formattedStatusUpdates = statusUpdates.map((update) => ({
      id: update.id,
      type: "status_update" as const,
      action: update.action,
      oldValue: update.oldValue,
      newValue: update.newValue,
      comment: update.comment,
      timestamp: update.timestamp,
      createdAt: update.timestamp,
      user: update.User || { id: 'unknown', name: 'Unknown User', avatar: null },
    }))

    // Format comments
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      type: "comment" as const,
      action: "COMMENT_ADDED",
      content: comment.content,
      timestamp: comment.createdAt,
      createdAt: comment.createdAt,
      user: comment.User || { id: 'unknown', name: 'Unknown User', avatar: null },
    }))

    // Merge and sort by date (newest first)
    const timeline = [...formattedStatusUpdates, ...formattedComments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json(timeline)
  } catch (error) {
    console.error("Error fetching timeline:", error)
    return NextResponse.json(
      { error: "Failed to fetch timeline" },
      { status: 500 }
    )
  }
}
