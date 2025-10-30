import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/column-labels - Get all column labels
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const columnLabels = await prisma.columnLabel.findMany({
      orderBy: { columnKey: "asc" },
    });

    return NextResponse.json(columnLabels);
  } catch (error) {
    console.error("Error fetching column labels:", error);
    return NextResponse.json(
      { error: "Failed to fetch column labels" },
      { status: 500 }
    );
  }
}

// POST /api/column-labels - Create or update a column label
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { columnKey, customLabel } = body;

    if (!columnKey || !customLabel) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Upsert (create or update)
    const columnLabel = await prisma.columnLabel.upsert({
      where: { columnKey },
      update: { customLabel },
      create: { columnKey, customLabel },
    });

    return NextResponse.json(columnLabel);
  } catch (error) {
    console.error("Error creating/updating column label:", error);
    return NextResponse.json(
      { error: "Failed to save column label" },
      { status: 500 }
    );
  }
}

// DELETE /api/column-labels - Delete a column label (revert to default)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const columnKey = searchParams.get("columnKey");

    if (!columnKey) {
      return NextResponse.json(
        { error: "columnKey is required" },
        { status: 400 }
      );
    }

    await prisma.columnLabel.delete({
      where: { columnKey },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting column label:", error);
    return NextResponse.json(
      { error: "Failed to delete column label" },
      { status: 500 }
    );
  }
}
