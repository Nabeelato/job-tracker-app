import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all jobs with related data
    const allJobs = await prisma.job.findMany({
      where: {
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
      },
      include: {
        User_Job_managerIdToUser: true,
        User_Job_supervisorIdToUser: true,
        User_Job_assignedToIdToUser: true,
        Department: true,
        _count: {
          select: {
            Comment: true,
          },
        },
      },
    });

    const completedJobs = await prisma.job.count({
      where: {
        status: "COMPLETED",
      },
    });

    const cancelledJobs = await prisma.job.count({
      where: {
        status: "CANCELLED",
      },
    });

    // Calculate status distribution
    const statusDistribution = {
      PENDING: allJobs.filter((j: any) => j.status === "PENDING").length,
      IN_PROGRESS: allJobs.filter((j: any) => j.status === "IN_PROGRESS").length,
      ON_HOLD: allJobs.filter((j: any) => j.status === "ON_HOLD").length,
      AWAITING_APPROVAL: allJobs.filter((j: any) => j.status === "AWAITING_APPROVAL").length,
      COMPLETED: completedJobs,
      CANCELLED: cancelledJobs,
    };

    // Calculate overdue jobs
    const today = new Date();
    const overdueJobs = allJobs.filter(
      (j: any) => j.dueDate && new Date(j.dueDate) < today
    ).length;

    // Calculate due soon (within 7 days)
    const dueSoonJobs = allJobs.filter((j: any) => {
      if (!j.dueDate) return false;
      const dueDate = new Date(j.dueDate);
      const daysDiff = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff >= 0 && daysDiff <= 7;
    }).length;

    // Calculate priority distribution
    const priorityDistribution = {
      URGENT: allJobs.filter((j: any) => j.priority === "URGENT").length,
      HIGH: allJobs.filter((j: any) => j.priority === "HIGH").length,
      NORMAL: allJobs.filter((j: any) => j.priority === "NORMAL").length,
      LOW: allJobs.filter((j: any) => j.priority === "LOW").length,
    };

    // Calculate workload by user (top 10)
    const userWorkload: { [key: string]: { name: string; count: number; role: string } } = {};
    
    allJobs.forEach((job: any) => {
      if (job.User_Job_assignedToIdToUser) {
        const userId = job.User_Job_assignedToIdToUser.id;
        if (!userWorkload[userId]) {
          userWorkload[userId] = {
            name: job.User_Job_assignedToIdToUser.name,
            count: 0,
            role: job.User_Job_assignedToIdToUser.role,
          };
        }
        userWorkload[userId].count++;
      }
    });

    const topUsers = Object.values(userWorkload)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate department distribution
    const departmentWorkload: { [key: string]: { name: string; count: number } } = {};
    
    allJobs.forEach((job: any) => {
      if (job.Department) {
        const deptId = job.Department.id;
        if (!departmentWorkload[deptId]) {
          departmentWorkload[deptId] = {
            name: job.Department.name,
            count: 0,
          };
        }
        departmentWorkload[deptId].count++;
      }
    });

    const departmentStats = Object.values(departmentWorkload).sort(
      (a, b) => b.count - a.count
    );

    // Calculate service type distribution
    const serviceTypeDistribution: { [key: string]: number } = {
      BOOKKEEPING: 0,
      VAT: 0,
      AUDIT: 0,
      FINANCIAL_STATEMENTS: 0,
    };

    allJobs.forEach((job: any) => {
      if (job.serviceTypes && Array.isArray(job.serviceTypes)) {
        job.serviceTypes.forEach((type: any) => {
          if (type in serviceTypeDistribution) {
            serviceTypeDistribution[type]++;
          }
        });
      }
    });

    // Calculate completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCompletedJobs = await prisma.job.count({
      where: {
        status: "COMPLETED",
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const recentTotalJobs = await prisma.job.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const completionRate =
      recentTotalJobs > 0
        ? Math.round((recentCompletedJobs / recentTotalJobs) * 100)
        : 0;

    // Calculate average comments per job
    const totalComments = allJobs.reduce(
      (sum: number, job: any) => sum + job._count.comments,
      0
    );
    const avgComments =
      allJobs.length > 0 ? (totalComments / allJobs.length).toFixed(1) : "0";

    return NextResponse.json({
      summary: {
        totalActive: allJobs.length,
        totalCompleted: completedJobs,
        totalCancelled: cancelledJobs,
        overdue: overdueJobs,
        dueSoon: dueSoonJobs,
        completionRate,
        avgComments,
      },
      statusDistribution,
      priorityDistribution,
      serviceTypeDistribution,
      topUsers,
      departmentStats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
