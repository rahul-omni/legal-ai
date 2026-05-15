interface PublicPageRoute {
  login: string;
  signup: string;
  forgotPass: string;
  verifyEmail: string;
  verifyEmailSuccess: string;
  createPassword: string;
}

interface PrivatePageRoute {
  home: string;
  projects: string;
  editor: string;
  analytics: string;
  assembly: string;
  cases: string;
  aiAssistant: string;
  documentDrafting: string;
  dueDiligence: string;
  marketplace: string;
  templates: string;
  subscriptions: string;
}

export const routeConfig: {
  privateRoutes: PrivatePageRoute;
  publicRoutes: PublicPageRoute;
} = {
  privateRoutes: {
    home: "/workspace",
    projects: "/projects",
    editor: "/editor",
    analytics: "/analytics",
    assembly: "/assembly",
    cases: "/cases",
    aiAssistant: "/ai-assistant",
    documentDrafting: "/document-drafting",
    dueDiligence: "/due-diligence",
    marketplace: "/marketplace",
    templates: "/templates",
    subscriptions: "/subscriptions",
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
