import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "./app/api/(public-routes)/auth/[...nextauth]/route";
import { routeConfig } from "./lib/routeConfig";

export async function middleware(request: NextRequest) {
  const session = await auth();

  const privateRoute = Object.values(routeConfig.privateRoutes).find(
    (route) => {
      const isMatch = request.nextUrl.pathname.startsWith(route);
      return isMatch;
    }
  );

  if (privateRoute) {
    if (!session) {
      return NextResponse.redirect(
        new URL(routeConfig.publicRoutes.login, request.url)
      );
    }

    // Extract organization ID from the URL
    // e.g., /org/org_123/dashboard -> org_123
    const orgIdMatch = request.nextUrl.pathname.match(/\/org\/([^\/]+)/);

    if (orgIdMatch) {
      const organizationId = orgIdMatch[1];

      // Check if user has membership in this organization
      const hasAccess = session.user.memberships.some(
        (membership) => membership.organizationId === organizationId
      );

      if (!hasAccess) {
        // User does not have access to this organization
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }
  }

  // Protect admin routes
  // if (request.nextUrl.pathname.startsWith("/admin/")) {
  //   if (!session) {
  //     return NextResponse.redirect(new URL("/auth/login", request.url));
  //   }

  //   // Check if user has admin role in any organization
  //   const isAdmin = session.user.memberships.some(
  //     (membership) => membership.roleId === "ADMIN"
  //   );

  //   if (!isAdmin) {
  //     return NextResponse.redirect(new URL("/unauthorized", request.url));
  //   }
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
