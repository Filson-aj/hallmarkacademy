import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const { pathname } = req.nextUrl;

        // Redirect /login to /auth/signin
        if (pathname === "/login") {
            return NextResponse.redirect(new URL("/auth/signin", req.url));
        }

        // Define role-based access
        const roleRoutes = {
            super: ["/dashboard/super"],
            admin: ["/dashboard/admin"],
            management: ["/dashboard/management"],
            teacher: ["/dashboard/teacher"],
            student: ["/dashboard/student"],
            parent: ["/dashboard/parent"],
        };

        // Check if user is accessing a protected route
        for (const [role, routes] of Object.entries(roleRoutes)) {
            for (const route of routes) {
                if (pathname.startsWith(route)) {
                    if (token?.role !== role) {
                        // Redirect to appropriate dashboard based on user's role
                        return NextResponse.redirect(new URL(`/dashboard/${token?.role || 'auth/signin'}`, req.url));
                    }
                }
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl;

                // Allow access to public routes
                if (pathname === "/" || pathname.startsWith("/auth/") || pathname === "/login") {
                    return true;
                }

                // Require authentication for all other routes
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|assets).*)",
    ],
};