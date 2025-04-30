interface PublicPageRoute {
  login: string;
  signup: string;
  forgotPass: string;
  verifyEmail: string;
  verifyEmailSuccess: string;
  createPassword: string;
}

interface PrivatePageRoute {
  projects: string;
  editor: string;
  analytics: string;
  assembly: string;
  cases: string;
  dueDiligence: string;
  marketplace: string;
  templates: string;
  settings: string;
}

export const routeConfig: {
  privateRoutes: PrivatePageRoute;
  publicRoutes: PublicPageRoute;
} = {
  privateRoutes: {
    projects: "/projects",
    editor: "/editor",
    analytics: "/analytics",
    assembly: "/assembly",
    cases: "/cases",
    dueDiligence: "/due-diligence",
    marketplace: "/marketplace",
    templates: "/templates",
    settings: "/settings",
  },
  publicRoutes: {
    login: "/login",
    signup: "/signup",
    createPassword: "/create-password",
    forgotPass: "/forgot-password",
    verifyEmail: "/verify-email",
    verifyEmailSuccess: "/verify-email/success",
  },
};
