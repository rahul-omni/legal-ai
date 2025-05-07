import { routeConfig } from "@/lib/routeConfig";
import { NextResponse } from "next/server";
import { auth } from "./app/api/(public-routes)/auth/[...nextauth]/route";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Skip auth for public routes
  const isPublicRoute = Object.values(routeConfig.publicRoutes).some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!req.auth) {
    return NextResponse.redirect(
      new URL(routeConfig.publicRoutes.login, req.nextUrl.origin)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
