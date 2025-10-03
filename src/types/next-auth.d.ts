import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: "ADMIN" | "MANAGER" | "SUPERVISOR" | "STAFF"
      departmentId?: string
      avatar?: string
    }
  }

  interface User {
    id: string
    name: string
    email: string
    role: "ADMIN" | "MANAGER" | "SUPERVISOR" | "STAFF"
    departmentId?: string
    avatar?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "ADMIN" | "MANAGER" | "SUPERVISOR" | "STAFF"
    departmentId?: string
  }
}
