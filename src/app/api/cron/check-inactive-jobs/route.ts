import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkReminderNeeded } from "@/lib/business-hours";

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * Cron job to check for inactive jobs and send reminders
 * Should be triggered hourly by Vercel Cron or external scheduler
 * 
 * On Vercel, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-inactive-jobs",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is coming from a cron job (optional security)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all active jobs (not completed or cancelled)
    const activeJobs = await prisma.job.findMany({
      where: {
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
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
    });

    let notificationsSent = 0;
    const jobsChecked = activeJobs.length;

    for (const job of activeJobs) {
      const reminderCheck = checkReminderNeeded(
        job.lastActivityAt,
        job.lastReminderSentAt,
        job.reminderSnoozeUntil
      );

      if (!reminderCheck.needsReminder) {
        continue;
      }

      const level = reminderCheck.level;

      if (level === "24h") {
        // Send reminder to assigned staff member only
        if (job.assignedToId) {
          await prisma.notification.create({
            data: {
              id: crypto.randomUUID(),
              userId: job.assignedToId,
              type: "JOB_INACTIVE_24H",
              title: "Job has been inactive for 24 hours",
              content: `Job "${job.title}" for ${job.clientName} has had no activity for 24 business hours.`,
              jobId: job.id,
            },
          });
          notificationsSent++;
        }

        // Update last reminder sent time
        await prisma.job.update({
          where: { id: job.id },
          data: { lastReminderSentAt: new Date() },
        });
      } else if (level === "48h") {
        // Send reminders to staff, supervisor, AND admin
        const userIdsToNotify = new Set<string>();

        if (job.assignedToId) {
          userIdsToNotify.add(job.assignedToId);
        }
        if (job.supervisorId) {
          userIdsToNotify.add(job.supervisorId);
        }
        if (job.managerId) {
          userIdsToNotify.add(job.managerId);
        }

        // Find all admins
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { id: true },
        });

        admins.forEach((admin) => userIdsToNotify.add(admin.id));

        // Send notifications to all relevant users
        for (const userId of Array.from(userIdsToNotify)) {
          await prisma.notification.create({
            data: {
              id: crypto.randomUUID(),
              userId,
              type: "JOB_INACTIVE_48H",
              title: "URGENT: Job inactive for 48 hours",
              content: `Job "${job.title}" for ${job.clientName} has had NO ACTIVITY for 48 business hours. Immediate attention required!`,
              jobId: job.id,
            },
          });
          notificationsSent++;
        }

        // Update last reminder sent time
        await prisma.job.update({
          where: { id: job.id },
          data: { lastReminderSentAt: new Date() },
        });
      }
    }

    return NextResponse.json({
      success: true,
      jobsChecked,
      notificationsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in inactive jobs cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
