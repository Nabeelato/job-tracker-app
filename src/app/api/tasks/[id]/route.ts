import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH - Update task (mark complete, change status, track time)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, title, description, clientName } = body;

    // Get the task
    // @ts-expect-error - Prisma client type not yet recognized by TS server
    const task = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Only task creator can mark as complete or update
    if (task.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only update your own tasks" },
        { status: 403 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      
      // Time tracking logic
      if (status === "IN_PROGRESS" && task.status === "PENDING") {
        // Starting the task - record start time
        updateData.startedAt = new Date();
      } else if (status === "COMPLETED" && task.status === "IN_PROGRESS") {
        // Completing the task - calculate time spent
        updateData.completedAt = new Date();
        if (task.startedAt) {
          const timeSpentMs = updateData.completedAt.getTime() - task.startedAt.getTime();
          updateData.timeSpentMinutes = Math.round(timeSpentMs / 60000); // Convert to minutes
        }
      } else if (status === "COMPLETED" && task.status !== "IN_PROGRESS") {
        // Completed without going through IN_PROGRESS
        updateData.completedAt = new Date();
        if (task.startedAt) {
          const timeSpentMs = updateData.completedAt.getTime() - task.startedAt.getTime();
          updateData.timeSpentMinutes = Math.round(timeSpentMs / 60000);
        }
      } else if (status === "PENDING") {
        // Reset to pending - clear time tracking
        updateData.startedAt = null;
        updateData.completedAt = null;
        updateData.timeSpentMinutes = null;
      }
    }

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (clientName !== undefined) {
      updateData.clientName = clientName?.trim() || null;
    }

    // @ts-expect-error - Prisma client type not yet recognized by TS server
    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
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
      ...updatedTask,
      user: updatedTask.User,
    };

    return NextResponse.json(taskWithUser);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE - Delete task (Admin/Manager only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin/Manager can delete
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Only admins and managers can delete tasks" },
        { status: 403 }
      );
    }

    // @ts-expect-error - Prisma client type not yet recognized by TS server
    const task = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // @ts-expect-error - Prisma client type not yet recognized by TS server
    await prisma.task.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
