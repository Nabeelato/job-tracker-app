import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/custom-fields - Get all custom fields
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const customFields = await prisma.customField.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(customFields);
  } catch (error) {
    console.error("Error fetching custom fields:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom fields" },
      { status: 500 }
    );
  }
}

// POST /api/custom-fields - Create a new custom field
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      fieldKey,
      fieldLabel,
      fieldType,
      options = [],
      isRequired = false,
      isActive = true,
      sortOrder = 0,
      category,
      description,
      defaultValue,
    } = body;

    // Validate required fields
    if (!fieldKey || !fieldLabel || !fieldType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if fieldKey already exists
    const existing = await prisma.customField.findUnique({
      where: { fieldKey },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A custom field with this key already exists" },
        { status: 400 }
      );
    }

    const customField = await prisma.customField.create({
      data: {
        fieldKey,
        fieldLabel,
        fieldType,
        options,
        isRequired,
        isActive,
        sortOrder,
        category,
        description,
        defaultValue,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(customField, { status: 201 });
  } catch (error) {
    console.error("Error creating custom field:", error);
    return NextResponse.json(
      { error: "Failed to create custom field" },
      { status: 500 }
    );
  }
}
