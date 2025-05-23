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
  nodes: "/nodes";
  node: (_nodeId: string) => `/node/${string}`;
  nodeTree: "/system/tree";
  roles: "/roles";
  user: "/user";
  inviteTeamMember: "/invite-team-member";
  teamMembers(_orgId: string): `/organization/${string}/team-members`;
  reviews: "/reviews";
  reviewDetails(_reviewId: string): `/reviews/${string}`;
  reviewStatus(_reviewId: string): `/reviews/${string}/status`;
  reviewComments(_reviewId: string): `/reviews/${string}/comments`;
  resolveComment(_commentId: string): `/reviews/comments/${string}/resolve`;
  resolveComment(_commentId: string): `/reviews/comments/${string}/resolve`;
  organization(_orgId: string): `/organization/${string}`;
  fileReviewReq: `/file-reviews`;

  organizationInvitations(orgId: string): `/organization/${string}/invitations`;
}

export const apiRouteConfig: {
  privateRoutes: PrivateApiRoute;
  publicRoutes: PublicApiRoute;
} = {
  privateRoutes: {
    nodes: "/nodes",
    node: (nodeId: string) => `/node/${nodeId}`,
    nodeTree: "/system/tree",
    roles: "/roles",
    user: "/user",
    teamMembers: (orgId) => `/organization/${orgId}/team-members`,
    inviteTeamMember: "/invite-team-member",
    reviews: "/reviews",
    reviewDetails: (reviewId) => `/reviews/${reviewId}`,
    reviewStatus: (reviewId) => `/reviews/${reviewId}/status`,
    reviewComments: (reviewId) => `/reviews/${reviewId}/comments`,
    resolveComment: (commentId) => `/reviews/comments/${commentId}/resolve`,
    organization: (ordId) => `/organization/${ordId}`,
    fileReviewReq: `/file-reviews`,
    organizationInvitations: (orgId: string) =>
      `/organization/${orgId}/invitations`,
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
