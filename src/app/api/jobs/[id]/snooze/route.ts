import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateSnoozeUntil } from "@/lib/business-hours";
import { logJobSnoozed } from "@/lib/activity";

/**
 * Snooze job activity reminders for 24 business hours
 * POST /api/jobs/[id]/snooze
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the actual database user by email
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    const jobId = params.id;

    // Get the job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        clientName: true,
        assignedToId: true,
        supervisorId: true,
        managerId: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if user has permission to snooze
    // Only assigned staff, supervisor, manager, or admin can snooze
    const canSnooze =
      job.assignedToId === dbUser.id ||
      job.supervisorId === dbUser.id ||
      job.managerId === dbUser.id ||
      dbUser.role === "ADMIN";

    if (!canSnooze) {
      return NextResponse.json(
        { error: "You don't have permission to snooze this job" },
        { status: 403 }
      );
    }

    // Calculate snooze until date (24 business hours from now)
    const snoozeUntil = calculateSnoozeUntil();

    // Update job
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        reminderSnoozeUntil: snoozeUntil,
      },
    });

    // Log activity
    await logJobSnoozed(jobId, dbUser.id, snoozeUntil);

    return NextResponse.json({
      success: true,
      snoozeUntil: snoozeUntil.toISOString(),
      message: `Reminders snoozed until ${snoozeUntil.toLocaleString()}`,
    });
  } catch (error) {
    console.error("Error snoozing job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Unsnooze job activity reminders
 * DELETE /api/jobs/[id]/snooze
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the actual database user by email
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    const jobId = params.id;

    // Get the job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        assignedToId: true,
        supervisorId: true,
        managerId: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if user has permission to unsnooze
    const canUnsnooze =
      job.assignedToId === dbUser.id ||
      job.supervisorId === dbUser.id ||
      job.managerId === dbUser.id ||
      dbUser.role === "ADMIN";

    if (!canUnsnooze) {
      return NextResponse.json(
        { error: "You don't have permission to unsnooze this job" },
        { status: 403 }
      );
    }

    // Update job
    await prisma.job.update({
      where: { id: jobId },
      data: {
        reminderSnoozeUntil: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reminders unsnoozed",
    });
  } catch (error) {
    console.error("Error unsnoozing job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
