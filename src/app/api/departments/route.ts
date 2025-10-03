import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all departments with details
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        managerId: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            users: true,
            jobs: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new department (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, managerId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    // Check if manager exists and has appropriate role
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
      });

      if (!manager) {
        return NextResponse.json(
          { error: "Manager not found" },
          { status: 404 }
        );
      }

      if (!["MANAGER", "ADMIN"].includes(manager.role)) {
        return NextResponse.json(
          { error: "User must be a Manager or Admin" },
          { status: 400 }
        );
      }
    }

    const department = await prisma.department.create({
      data: {
        name,
        managerId,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error("Error creating department:", error);
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    );
  }
}
