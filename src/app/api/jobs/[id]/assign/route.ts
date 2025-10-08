import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logJobAssigned, logJobReassigned } from "@/lib/activity"

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

    const { staffId } = await request.json()
    const jobId = params.id

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      )
    }

    // Get the job to check permissions
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

    // Check if user is the supervisor or manager/admin
    const isSupervisor = job.supervisorId === dbUser.id
    const isManagerOrAdmin = ["MANAGER", "ADMIN"].includes(dbUser.role)

    if (!isSupervisor && !isManagerOrAdmin) {
      return NextResponse.json(
        { error: "Only the assigned supervisor or manager/admin can assign staff to this job" },
        { status: 403 }
      )
    }

    // Verify the staff member exists and has STAFF role
    const staff = await prisma.user.findUnique({
      where: { id: staffId },
    })

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      )
    }

    if (staff.role !== "STAFF") {
      return NextResponse.json(
        { error: "Selected user must have STAFF role" },
        { status: 400 }
      )
    }

    // Update the job with the assigned staff
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        assignedToId: staffId,
      },
      include: {
        User_Job_assignedToIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        User_Job_supervisorIdToUser: {
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
      },
    })

    // Create a status update entry for the assignment
    await prisma.statusUpdate.create({
      data: {
        id: crypto.randomUUID(),
        jobId: job.id,
        userId: dbUser.id,
        action: "STAFF_ASSIGNED",
        oldValue: job.User_Job_assignedToIdToUser?.name || null,
        newValue: staff.name,
      },
    })

    // Log activity
    const previousAssigneeName = job.User_Job_assignedToIdToUser?.name || "Unassigned"
    if (job.assignedToId) {
      await logJobReassigned(job.id, dbUser.id, previousAssigneeName, staff.name || "Staff", staffId)
    } else {
      await logJobAssigned(job.id, dbUser.id, staff.name || "Staff", staffId)
    }

    return NextResponse.json(updatedJob)
  } catch (error) {
    console.error("Error assigning staff to job:", error)
    return NextResponse.json(
      { error: "Failed to assign staff to job" },
      { status: 500 }
    )
  }
}
