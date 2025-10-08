import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, isActive, departmentId } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Check if this is the first user (make them admin automatically)
    const userCount = await prisma.user.count()
    const isFirstUser = userCount === 0
    
    // First user is always ADMIN, otherwise use provided role or default to STAFF
    const userRole = isFirstUser ? "ADMIN" : (role || "STAFF")

    // Create user
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name,
        email,
        password: hashedPassword,
        role: userRole,
        isActive: isActive !== undefined ? isActive : true,
        departmentId: departmentId || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    return NextResponse.json(
      { 
        message: "User created successfully",
        user 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
