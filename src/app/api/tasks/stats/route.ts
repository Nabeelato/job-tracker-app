import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Fetch task statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const where: any = userId ? { userId } : {};

    // If staff, only show their own stats
    if (session.user.role === "STAFF" && !userId) {
      where.userId = session.user.id;
    }

    const [total, pending, inProgress, completed, todayTotal, totalTimeSpent] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.count({ where: { ...where, status: "PENDING" } }),
      prisma.task.count({ where: { ...where, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { ...where, status: "COMPLETED" } }),
      prisma.task.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.task.aggregate({
        where: {
          ...where,
          timeSpentMinutes: {
            not: null,
          },
        },
        _sum: {
          timeSpentMinutes: true,
        },
      }),
    ]);

    // Get tasks per client
    const tasksByClient = await prisma.task.groupBy({
      by: ["clientName"],
      where: {
        ...where,
        clientName: {
          not: null,
        },
      },
      _count: {
        clientName: true,
      },
      orderBy: {
        _count: {
          clientName: "desc",
        },
      },
      take: 10,
    });

    // Get average time per task
    const completedTasks = await prisma.task.findMany({
      where: {
        ...where,
        status: "COMPLETED",
        timeSpentMinutes: {
          not: null,
        },
      },
      select: {
        timeSpentMinutes: true,
      },
    });

    const avgTimePerTask = completedTasks.length > 0
      ? Math.round(completedTasks.reduce((sum: number, task: any) => sum + (task.timeSpentMinutes || 0), 0) / completedTasks.length)
      : 0;

    return NextResponse.json({
      total,
      pending,
      inProgress,
      completed,
      todayTotal,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalTimeSpentMinutes: totalTimeSpent._sum.timeSpentMinutes || 0,
      totalTimeSpentHours: Math.round((totalTimeSpent._sum.timeSpentMinutes || 0) / 60 * 10) / 10,
      avgTimePerTaskMinutes: avgTimePerTask,
      tasksByClient: tasksByClient.map((item: any) => ({
        clientName: item.clientName,
        count: item._count.clientName,
      })),
    });
  } catch (error) {
    console.error("Error fetching task stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
