import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { redirectToURL } from "./app/api/lib/redirect";
import { routeConfig } from "./lib/routeConfig";

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("authToken")?.value;
  const verified = request.cookies.get("verified")?.value === "true";

  const privateRoute = Object.values(routeConfig.privateRoutes).find((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  const publicRoute = Object.values(routeConfig.publicRoutes).find((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (request.nextUrl.pathname === "/") {
    return redirectToURL(routeConfig.publicRoutes.login);
  } else if (privateRoute && !authToken) {
    return redirectToURL(routeConfig.publicRoutes.login);
  } else if (privateRoute && authToken && !verified) {
    return redirectToURL(routeConfig.publicRoutes.verifyEmail);
  } else if (publicRoute && authToken) {
    redirectToURL(routeConfig.privateRoutes.projects);
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
