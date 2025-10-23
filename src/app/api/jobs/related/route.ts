import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get("clientName")
    const excludeJobId = searchParams.get("excludeJobId")

    if (!clientName) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 })
    }

    // Fetch all jobs with the same client name (no role-based filtering)
    // This allows staff to see related jobs for the same client
    const jobs = await prisma.job.findMany({
      where: {
        clientName: {
          equals: clientName,
          mode: 'insensitive', // Case-insensitive match
        },
        ...(excludeJobId && { NOT: { id: excludeJobId } }), // Exclude current job
      },
      select: {
        id: true,
        jobId: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        User_Job_managerIdToUser: {
          select: {
            id: true,
            name: true,
          },
        },
        User_Job_assignedToIdToUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Transform to frontend-friendly format
    const transformedJobs = jobs.map((job: any) => ({
      id: job.id,
      jobId: job.jobId,
      title: job.title,
      status: job.status,
      priority: job.priority,
      createdAt: job.createdAt,
      manager: job.User_Job_managerIdToUser,
      assignedTo: job.User_Job_assignedToIdToUser,
    }))

    return NextResponse.json(transformedJobs)
  } catch (error) {
    console.error("Error fetching related jobs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
