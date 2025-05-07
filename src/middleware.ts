import { routeConfig } from "@/lib/routeConfig";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { auth } from "./app/api/[...nextauth]/route";

export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl;

  // Skip auth for public routes
  console.log(`Middleware: Processing request for path: ${pathname}`);
  
  const isPublicRoute = Object.values(routeConfig.publicRoutes).some((route) =>
    pathname.startsWith(route)
  );
  
  console.log(`Middleware: Is public route: ${isPublicRoute}`, {
    pathname,
    publicRoutes: routeConfig.publicRoutes
  });

  if (isPublicRoute) {
    console.log(`Middleware: Allowing access to public route: ${pathname}`);
    return NextResponse.next();
  }

  console.log(`Middleware: Auth status:`, { 
    isAuthenticated: !!req.auth,
    authData: req.auth 
  });
  
  if (!req.auth) {
    const redirectUrl = new URL(routeConfig.publicRoutes.login, req.nextUrl.origin);
    console.log(`Middleware: Redirecting unauthenticated user to: ${redirectUrl.toString()}`);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
