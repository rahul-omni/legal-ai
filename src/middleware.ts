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

  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(
      new URL(routeConfig.publicRoutes[0], request.url)
    );
  }

  if (privateRoute && !authToken) {
    return NextResponse.redirect(
      new URL(routeConfig.publicRoutes[0], request.url)
    );
  } else if (publicRoute && authToken) {
    return NextResponse.redirect(
      new URL(routeConfig.privateRoutes[0], request.url)
    );
  }

  const response = NextResponse.next();
  if (authToken) {
    response.headers.set("Authorization", `Bearer ${authToken}`);
  }
  return response;
}

export const config = {
  matcher: [
    "/",
    ...routeConfig.privateRoutes.map((route) => `${route}/:path*`),
  ],
};
