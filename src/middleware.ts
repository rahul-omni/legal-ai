import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { routeConfig } from "./lib/routeConfig";

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("authToken")?.value;
  const verified = request.cookies.get("verified")?.value;

  const privateRoute = Object.values(routeConfig.privateRoutes).find((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  const publicRoute = Object.values(routeConfig.publicRoutes).find((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(
      new URL(routeConfig.publicRoutes.login, request.url)
    );
  }

  if (privateRoute && !authToken) {
    return NextResponse.redirect(
      new URL(routeConfig.publicRoutes.login, request.url)
    );
  } else if (privateRoute && authToken && !verified) {
    return NextResponse.redirect(
      new URL(routeConfig.publicRoutes.verifyEmail, request.url)
    );
  } else if (publicRoute && authToken) {
    return NextResponse.redirect(
      new URL(routeConfig.privateRoutes.projects, request.url)
    );
  }

  const response = NextResponse.next();

  if (authToken) {
    response.headers.set("Authorization", `Bearer ${authToken}`);
  }

  return response;
}

const config = {
  matcher: [
    "/",
    ...Object.values(routeConfig.privateRoutes).map(
      (route) => `${route}/:path*`
    ),
  ],
};
