import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canCreateJobs } from "@/lib/permissions"
import { logJobCreated, logJobAssigned } from "@/lib/activity"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const assignedTo = searchParams.get("assignedTo")
    const departmentId = searchParams.get("departmentId")

    // Build filter based on user role
    const where: any = {}

    // Role-based filtering
    if (session.user.role === "STAFF") {
      // Staff can only see jobs assigned to them
      where.assignedToId = session.user.id
    } else if (session.user.role === "SUPERVISOR") {
      // Supervisor can only see jobs where they are assigned as supervisor
      where.supervisorId = session.user.id
    }
    // Managers and Admins can see all jobs (no filter)

    // Apply search filters
    if (status) where.status = status
    if (priority) where.priority = priority
    if (assignedTo) where.assignedToId = assignedTo
    if (departmentId) where.departmentId = departmentId

    const jobs = await prisma.job.findMany({
      where,
      include: {
        User_Job_assignedToIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
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
        Department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            Comment: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Check if jobs are late and update
    const now = new Date()
    for (const job of jobs) {
      if (job.dueDate) {
        const isLate = now > job.dueDate && job.status !== "COMPLETED"
        if (job.isLate !== isLate) {
          await prisma.job.update({
            where: { id: job.id },
            data: { isLate },
          })
          job.isLate = isLate
        }
      }
    }

    return NextResponse.json(jobs)
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user can create jobs
    if (!canCreateJobs(session.user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to create jobs" },
        { status: 403 }
      )
    }

    // Get the actual database user by email (session.user.id might not match DB ID)
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
    
    const {
      jobId,
      clientName,
      title,
      supervisorId,
      startedAt,
      dueDate, // NEW: Due date
      priority,
      serviceTypes,
      managerId: requestedManagerId, // Only ADMIN can specify this
    } = body

    // Determine the manager ID based on user role
    let managerId: string;
    
    if (session.user.role === 'ADMIN') {
      // ADMIN can specify which manager to assign
      if (!requestedManagerId) {
        return NextResponse.json(
          { error: "Admin must select a manager for the job" },
          { status: 400 }
        )
      }
      
      // Verify the requested manager exists and has MANAGER role
      const manager = await prisma.user.findUnique({
        where: { id: requestedManagerId },
      })
      
      if (!manager || manager.role !== "MANAGER") {
        return NextResponse.json(
          { error: "Invalid manager ID. Must be a user with MANAGER role" },
          { status: 400 }
        )
      }
      
      managerId = requestedManagerId;
    } else {
      // MANAGER/SUPERVISOR: use their own ID as manager
      managerId = dbUser.id;
    }

    // Validation - check for required fields (handle empty strings as missing)
    const missingFields = [];
    if (!jobId || jobId.trim() === "") missingFields.push("Job ID");
    if (!clientName || clientName.trim() === "") missingFields.push("Client Name");
    if (!title || title.trim() === "") missingFields.push("Job Title");
    if (!supervisorId || supervisorId.trim() === "") missingFields.push("Supervisor");
    if (!serviceTypes || serviceTypes.length === 0) missingFields.push("Service Types");

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      )
    }

    // Verify supervisor exists and has SUPERVISOR role
    const supervisor = await prisma.user.findUnique({
      where: { id: supervisorId },
    })

    if (!supervisor || supervisor.role !== "SUPERVISOR") {
      return NextResponse.json(
        { error: "Invalid supervisor ID. Must be a user with SUPERVISOR role" },
        { status: 400 }
      )
    }

    // Initially assign to supervisor (they will assign to staff later)
    // Use managerId as the assignedById (job creator)
    const job = await prisma.job.create({
      data: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        jobId,
        clientName,
        title,
        assignedToId: supervisorId, // Initially assigned to supervisor
        assignedById: managerId,
        managerId,
        supervisorId,
        serviceTypes: {
          set: serviceTypes || [],
        },
        priority: priority || "NORMAL",
        startedAt: startedAt ? new Date(startedAt) : null,
        dueDate: dueDate ? new Date(dueDate) : null, // NEW: Add due date
      },
      include: {
        User_Job_assignedToIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
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
      },
    })

    // Create status update
    await prisma.statusUpdate.create({
      data: {
        id: crypto.randomUUID(),
        jobId: job.id,
        userId: managerId,
        action: "JOB_CREATED",
        newValue: "PENDING",
      },
    })

    // Log activity
    await logJobCreated(job.id, managerId, clientName)
    await logJobAssigned(job.id, managerId, supervisor.name || "Supervisor", supervisorId)

    // Create notification for supervisor
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: supervisorId,
        type: "JOB_ASSIGNED",
        title: "New job assigned to you",
        content: `Manager assigned you "${title}". Please assign it to a staff member.`,
        jobId: job.id,
      },
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error("Error creating job:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
