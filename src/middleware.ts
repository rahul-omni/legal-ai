import { routeConfig } from "@/lib/routeConfig";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { auth } from "./app/api/lib/auth/nextAuthConfig";
import { redirectToURL } from "./app/api/helper/redirect";

export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl;

  const isPublicRoute = Object.values(routeConfig.publicRoutes).some((route) =>
    pathname.startsWith(route)
  );
  const isPrivateRoute = Object.values(routeConfig.privateRoutes).some(
    (route) => pathname.startsWith(route)
  );

  if (pathname === "/") {
    return redirectToURL(routeConfig.publicRoutes.login);
  } else if (isPrivateRoute && !req.auth) {
    return redirectToURL(routeConfig.publicRoutes.login);
  } else if (isPublicRoute && req.auth) {
    return redirectToURL(routeConfig.privateRoutes.projects);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
