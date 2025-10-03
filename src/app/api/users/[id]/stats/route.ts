import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate statistics based on role
    const stats: any = {
      user,
      totalJobsCreated: 0,
      totalJobsAssigned: 0,
      totalJobsManaged: 0,
      totalJobsSupervised: 0,
      completedAsStaff: 0,
      completedAsManager: 0,
      completedAsSupervisor: 0,
      cancelledAsManager: 0,
      activeJobs: 0,
    };

    // Jobs created by this user
    stats.totalJobsCreated = await prisma.job.count({
      where: { assignedById: userId },
    });

    // Jobs assigned to this user (as staff)
    const assignedJobs = await prisma.job.findMany({
      where: { assignedToId: userId },
      select: { id: true, status: true },
    });
    stats.totalJobsAssigned = assignedJobs.length;
    stats.completedAsStaff = assignedJobs.filter(
      (j: any) => j.status === "COMPLETED"
    ).length;
    stats.activeJobs = assignedJobs.filter(
      (j: any) => j.status !== "COMPLETED" && j.status !== "CANCELLED"
    ).length;

    // Jobs managed by this user
    const managedJobs = await prisma.job.findMany({
      where: { managerId: userId },
      select: { id: true, status: true },
    });
    stats.totalJobsManaged = managedJobs.length;
    stats.completedAsManager = managedJobs.filter(
      (j: any) => j.status === "COMPLETED"
    ).length;
    stats.cancelledAsManager = managedJobs.filter(
      (j: any) => j.status === "CANCELLED"
    ).length;

    // Jobs supervised by this user
    const supervisedJobs = await prisma.job.findMany({
      where: { supervisorId: userId },
      select: { id: true, status: true },
    });
    stats.totalJobsSupervised = supervisedJobs.length;
    stats.completedAsSupervisor = supervisedJobs.filter(
      (j: any) => j.status === "COMPLETED"
    ).length;

    // Additional metrics
    stats.totalCompleted =
      stats.completedAsStaff +
      stats.completedAsManager +
      stats.completedAsSupervisor;

    // Calculate completion rate
    if (stats.totalJobsAssigned > 0) {
      stats.completionRate = Math.round(
        (stats.completedAsStaff / stats.totalJobsAssigned) * 100
      );
    } else {
      stats.completionRate = 0;
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user statistics" },
      { status: 500 }
    );
  }
}
