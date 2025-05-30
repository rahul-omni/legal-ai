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
  node: (_nodeId: string) => `/nodes/${string}`;
  nodeTree: "/system/tree";
  roles: "/roles";
  user: "/user";
  inviteTeamMember: "/invite-team-member";
  teamMembers(_orgId: string): `/organization/${string}/team-members`;
  organization(_orgId: string): `/organization/${string}`;
  fileReviewReq: `/file-reviews`;
  reviewDetails(_reviewId: string): `/file-reviews/${string}`;
  reviewStatus(_reviewId: string): `/file-reviews/${string}/status`;
  reviewComments(_reviewId: string): `/file-reviews/${string}/comments`;
  resolveComment(_commentId: string): `/file-reviews/comments/${string}/resolve`;
  organizationInvitations(_orgId: string): `/organization/${string}/invitations`;
}

export const apiRouteConfig: {
  privateRoutes: PrivateApiRoute;
  publicRoutes: PublicApiRoute;
} = {
  privateRoutes: {
    nodes: "/nodes",
    node: (nodeId: string) => `/nodes/${nodeId}`,
    nodeTree: "/system/tree",
    roles: "/roles",
    user: "/user",
    teamMembers: (orgId) => `/organization/${orgId}/team-members`,
    inviteTeamMember: "/invite-team-member",
    fileReviewReq: `/file-reviews`,
    reviewDetails: (reviewId) => `/file-reviews/${reviewId}`,
    reviewStatus: (reviewId) => `/file-reviews/${reviewId}/status`,
    reviewComments: (reviewId) => `/file-reviews/${reviewId}/comments`,
    resolveComment: (commentId) => `/file-reviews/comments/${commentId}/resolve`,
    organization: (ordId) => `/organization/${ordId}`,
    
    // organizationInvitations: (orgId) => `/organization/${orgId}/invitations`,
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
