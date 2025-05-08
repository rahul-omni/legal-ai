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
  reviews: "/reviews";
  reviewDetails(reviewId: string): `/reviews/${string}`;
  reviewStatus(reviewId: string): `/reviews/${string}/status`;
  reviewComments(reviewId: string): `/reviews/${string}/comments`;
  resolveComment(commentId: string): `/reviews/comments/${string}/resolve`;
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
    reviewDetails: (reviewId) => `/reviews/${reviewId}`,
    reviewStatus: (reviewId) => `/reviews/${reviewId}/status`,
    reviewComments: (reviewId) => `/reviews/${reviewId}/comments`,
    resolveComment: (commentId) => `/reviews/comments/${commentId}/resolve`,
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
