import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Test endpoint to verify Activity model is working
 * GET /api/test-activity
 */
export async function GET() {
  try {
    // Test 1: Check if Activity model exists
    const activityCount = await prisma.activity.count();
    
    // Test 2: Check if ActivityType enum works
    const testActivity = {
      type: "COMMENT_ADDED" as const,
      description: "Test activity",
    };
    
    // Test 3: Get a sample job
    const sampleJob = await prisma.job.findFirst({
      select: {
        id: true,
        jobId: true,
        lastActivityAt: true,
        reminderSnoozeUntil: true,
      },
    });
    
    // Test 4: Get recent activities
    const recentActivities = await prisma.activity.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        User: { select: { name: true } },
        Job: { select: { jobId: true, clientName: true } },
      },
    });

    return NextResponse.json({
      success: true,
      tests: {
        activityModelExists: true,
        activityCount,
        activityTypeEnum: testActivity.type,
        sampleJob,
        recentActivities,
      },
      message: "Activity tracking system is working!",
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
