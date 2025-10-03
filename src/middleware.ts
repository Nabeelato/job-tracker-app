import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Admin-only routes
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Manager and above routes
    if (
      path.startsWith("/manage") &&
      !["ADMIN", "MANAGER"].includes(token?.role as string)
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Supervisor and above routes
    if (
      path.startsWith("/supervise") &&
      !["ADMIN", "MANAGER", "SUPERVISOR"].includes(token?.role as string)
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/jobs/:path*",
    "/admin/:path*",
    "/manage/:path*",
    "/supervise/:path*",
    "/profile/:path*",
    "/notifications/:path*",
  ],
}
