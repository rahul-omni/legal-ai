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
  teamMembers(_orgId: string): `/organization/${string}/team-members`;
  reviews: "/reviews";
  
  organization(_orgId: string): `/organization/${string}`;
  fileReviewReq: `/file-reviews`;
  reviewDetails(_reviewId: string): `/file-reviews/${string}`;
  reviewStatus(_reviewId: string): `/file-reviews/${string}/status`;
  reviewComments(_reviewId: string): `/file-reviews/${string}/comments`;
  resolveComment(_commentId: string): `/file-reviews/comments/${string}/resolve`;
  organizationInvitations(orgId: string): `/organization/${string}/invitations`;
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
    reviews: "/reviews",
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
