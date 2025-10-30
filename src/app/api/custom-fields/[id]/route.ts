import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/custom-fields/[id] - Get a single custom field
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customField = await prisma.customField.findUnique({
      where: { id: params.id },
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

    if (!customField) {
      return NextResponse.json(
        { error: "Custom field not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customField);
  } catch (error) {
    console.error("Error fetching custom field:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom field" },
      { status: 500 }
    );
  }
}

// PATCH /api/custom-fields/[id] - Update a custom field
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      fieldLabel,
      fieldType,
      options,
      isRequired,
      isActive,
      sortOrder,
      category,
      description,
      defaultValue,
    } = body;

    const customField = await prisma.customField.update({
      where: { id: params.id },
      data: {
        ...(fieldLabel !== undefined && { fieldLabel }),
        ...(fieldType !== undefined && { fieldType }),
        ...(options !== undefined && { options }),
        ...(isRequired !== undefined && { isRequired }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(defaultValue !== undefined && { defaultValue }),
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

    return NextResponse.json(customField);
  } catch (error) {
    console.error("Error updating custom field:", error);
    return NextResponse.json(
      { error: "Failed to update custom field" },
      { status: 500 }
    );
  }
}

// DELETE /api/custom-fields/[id] - Delete a custom field
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.customField.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom field:", error);
    return NextResponse.json(
      { error: "Failed to delete custom field" },
      { status: 500 }
    );
  }
}
