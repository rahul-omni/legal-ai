interface PublicRoute {
  login: string;
  signup: string;
  forgotPass: string;
  verifyEmail: string;
  verifyEmailSuccess: string;
}

interface PrivateRoute {
  projects: string;
  editor: string;
  analytics: string;
  assembly: string;
  cases: string;
  dueDiligence: string;
  marketplace: string;
  templates: string;
}

export const routeConfig: {
  privateRoutes: PrivateRoute;
  publicRoutes: PublicRoute;
} = {
  privateRoutes: {
    projects: "/projects",
    editor: "/editor",
    analytics: "/analytics",
    assembly: "/assembly",
    cases: "/cases",
    dueDiligence: "/due-diligence",
    marketplace: "/marketplace",
    templates: "templates",
  },
  publicRoutes: {
    login: "/login",
    signup: "/signup",
    forgotPass: "/forgot-password",
    verifyEmail: "/verify-email",
    verifyEmailSuccess: "/verify-email/success",
  },
};
