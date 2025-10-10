import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Si llegó aquí, está autenticado
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Solo permite acceso si tiene token (está logueado)
        return !!token
      },
    },
  }
)

// Proteger todas las rutas que empiecen con /dashboard
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/restaurant/:path*",
    "/api/menu-items/:path*",
    "/api/tables/:path*",
    "/api/dashboard/:path*",
    "/api/analytics/:path*",
    "/api/stripe/:path*"
  ]
}
