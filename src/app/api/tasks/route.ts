import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Fetch tasks with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const clientName = searchParams.get("clientName");
    const showAll = searchParams.get("showAll") === "true";

    const where: any = {};

    // If not admin/manager, only show own tasks
    if (session.user.role === "STAFF" && !showAll) {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (clientName) {
      where.clientName = {
        contains: clientName,
        mode: "insensitive",
      };
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.createdAt = {
        gte: startDate,
        lt: endDate,
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Map User to user for frontend compatibility
    const tasksWithUser = tasks.map((task: any) => ({
      ...task,
      user: task.User,
    }));

    return NextResponse.json(tasksWithUser);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST - Create new task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, clientName } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    // Get the actual database user
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    const task = await prisma.task.create({
      data: {
        id: crypto.randomUUID(),
        title: title.trim(),
        description: description?.trim() || null,
        clientName: clientName?.trim() || null,
        userId: dbUser.id,
        status: "PENDING",
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    // Map User to user for frontend compatibility
    const taskWithUser = {
      ...task,
      user: task.User,
    };

    return NextResponse.json(taskWithUser, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
