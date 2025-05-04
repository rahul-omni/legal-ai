interface PublicApiRoute {
  login: "/auth/login";
  signup: "/auth/signup";
  verifyEmail: "/auth/verify-email";
  verifyEmailSuccess: "/auth/verify-email/success";
  resendVerification: "/auth/resend-verification";
  acceptInvite: "/invite-team-member/accept";
  createPassword: "/auth/create-password";
}

interface PrivateApiRoute {
  node: "/nodes";
  nodeTree: "/system/tree";
  roles: "/roles";
  user: "/user";
  inviteTeamMember: "/invite-team-member";
  teamMembers(orgId: string): `/organization/${string}/team-members`;
}

export const apiRouteConfig: {
  privateRoutes: PrivateApiRoute;
  publicRoutes: PublicApiRoute;
} = {
  privateRoutes: {
    node: "/nodes",
    nodeTree: "/system/tree",
    roles: "/roles",
    user: "/user",
    teamMembers: (orgId) => `/organization/${orgId}/team-members`,
    inviteTeamMember: "/invite-team-member",
  },
  publicRoutes: {
    login: "/auth/login",
    signup: "/auth/signup",
    verifyEmail: "/auth/verify-email",
    verifyEmailSuccess: "/auth/verify-email/success",
    resendVerification: "/auth/resend-verification",
    acceptInvite: "/invite-team-member/accept",
    createPassword: "/auth/create-password",
  },
};
