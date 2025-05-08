import { FileReviewStatus } from "@prisma/client";

// services/review.service.ts
class ReviewService {
  async createReview(requesterId: string, fileId: string, reviewerId: string, orgId: string, dueDate?: Date) {
    // Verify requester has access to file
    // Verify reviewer is in same org
    // Create review record
  }
  
  async getReviewsForUser(userId: string, filters: { status?: FileReviewStatus }) {
    // Return reviews where user is reviewer or requester
  }
  
  async addComment(reviewId: string, userId: string, content: string) {
    // Verify user has access to review
    // Create comment
  }
}