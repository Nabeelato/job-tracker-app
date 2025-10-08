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

    // Fetch completed jobs for the user
    const completedJobs = await prisma.job.findMany({
      where: {
        OR: [
          { assignedToId: userId },
          { managerId: userId },
          { supervisorId: userId },
        ],
        status: "COMPLETED",
      },
      include: {
        User_Job_assignedByIdToUser: {
          select: {
            name: true,
          },
        },
        Department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    return NextResponse.json(completedJobs);
  } catch (error) {
    console.error("Error fetching completed jobs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
