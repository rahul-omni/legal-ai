interface PublicApiRoute {
  login: "/auth/login";
  signup: "/auth/signup";
  verifyEmail: "/auth/verify-email";
  verifyEmailSuccess: "/auth/verify-email/success";
  resendVerification: "/auth/resend-verification";
  inviteTeamMember: "/invite-team-member";
  acceptInvite: "/invite-team-member/accept";
}

interface PrivateApiRoute {
  node: "/nodes";
  nodeTree: "/system/tree";
  roles: "/roles";
}

export const apiRouteConfig: {
  privateRoutes: PrivateApiRoute;
  publicRoutes: PublicApiRoute;
} = {
  privateRoutes: {
    node: "/nodes",
    nodeTree: "/system/tree",
    roles: "/roles",
  },
  publicRoutes: {
    login: "/auth/login",
    signup: "/auth/signup",
    verifyEmail: "/auth/verify-email",
    verifyEmailSuccess: "/auth/verify-email/success",
    resendVerification: "/auth/resend-verification",
    inviteTeamMember: "/invite-team-member",
    acceptInvite: "/invite-team-member/accept",
  },
};
