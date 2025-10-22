import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN can delete all jobs
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can delete all jobs" },
        { status: 403 }
      );
    }

    // Delete all related records first (due to foreign keys)
    await prisma.comment.deleteMany({});
    await prisma.statusUpdate.deleteMany({});
    await prisma.notification.deleteMany({});
    
    // Delete all jobs
    const result = await prisma.job.deleteMany({});

    return NextResponse.json({
      message: `Successfully deleted ${result.count} jobs and all related data`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error deleting all jobs:", error);
    return NextResponse.json(
      { error: "Failed to delete jobs" },
      { status: 500 }
    );
  }
}
