import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json(); // "awaiting" or "received"
    
    const job = await prisma.job.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Update the job
    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: {
        awaitingClientReply: action === "awaiting",
        updatedAt: new Date(),
        lastActivityAt: new Date(),
      },
    });

    // Create a status update entry for timeline
    await prisma.statusUpdate.create({
      data: {
        id: crypto.randomUUID(),
        jobId: params.id,
        userId: session.user.id,
        action: action === "awaiting" ? "AWAITING_CLIENT_REPLY" : "CLIENT_REPLY_RECEIVED",
        oldValue: (job.awaitingClientReply ?? false) ? "Awaiting Reply" : "Normal",
        newValue: action === "awaiting" ? "Awaiting Reply" : "Reply Received",
        timestamp: new Date(),
      },
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error("Error updating client reply status:", error);
    return NextResponse.json(
      { error: "Failed to update client reply status" },
      { status: 500 }
    );
  }
}
