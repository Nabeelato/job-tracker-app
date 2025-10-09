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

    // Get all status updates for the job (which includes timeline events)
    const timeline = await prisma.statusUpdate.findMany({
      where: {
        jobId,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    })

    // Map User to user for frontend compatibility
    const formattedTimeline = timeline.map((event) => ({
      ...event,
      user: event.User,
    }))

    return NextResponse.json(formattedTimeline)
  } catch (error) {
    console.error("Error fetching timeline:", error)
    return NextResponse.json(
      { error: "Failed to fetch timeline" },
      { status: 500 }
    )
  }
}
