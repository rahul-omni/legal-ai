import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { routeConfig } from "./lib/routeConfig";

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("authToken")?.value;

  const privateRoute = routeConfig.privateRoutes.find((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  const publicRoute = routeConfig.publicRoutes.find((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  console.log("authToken", authToken);

  if (privateRoute && !authToken) {
    return NextResponse.redirect(
      new URL(routeConfig.publicRoutes[0], request.url)
    );
  } else if (publicRoute && authToken) {
    return NextResponse.redirect(
      new URL(routeConfig.privateRoutes[0], request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  // Optimized: Only match private routes
  matcher: routeConfig.privateRoutes,
};
