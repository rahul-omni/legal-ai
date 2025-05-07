import { routeConfig } from "@/lib/routeConfig";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { auth } from "./app/api/[...nextauth]/route";
import { logger } from "./app/api/lib/logger"; // Import logger

export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl;

  logger.info(`Incoming request to: ${pathname}`); // Log incoming request

  // Skip auth for public routes
  const isPublicRoute = Object.values(routeConfig.publicRoutes).some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    logger.info(`Public route accessed: ${pathname}`); // Log public route access
    return NextResponse.next();
  }

  if (!req.auth) {
    logger.warn(`Unauthorized access attempt to: ${pathname}`); // Log unauthorized access
    return NextResponse.redirect(
      new URL(routeConfig.publicRoutes.login, req.nextUrl.origin)
    );
  }

  logger.info(`Authorized access to: ${pathname}`); // Log authorized access
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
