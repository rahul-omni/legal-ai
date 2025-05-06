import { auth } from "./app/api/(public-routes)/auth/[...nextauth]/route";
import { routeConfig } from "./lib/routeConfig";

export default auth((req) => {
  const privateRoute = Object.values(routeConfig.privateRoutes).find(
    (route) => {
      const isMatch = req.nextUrl.pathname.startsWith(route);
      return isMatch;
    }
  );

  if (!req.auth && privateRoute) {
    const newUrl = new URL(routeConfig.publicRoutes.login, req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
