import { db } from "@/app/api/lib/db";
import { FileReview, FileReviewStatus, ReviewComment } from "@prisma/client";
import { ErrorNotFound, ErrorValidation } from "../lib/errors";

interface CreateReviewInput {
  fileId: string;
  reviewerId: string;
  requesterId: string;
  orgId: string;
  dueDate?: Date;
}

interface CreateCommentInput {
  reviewId: string;
  userId: string;
  content: string;
}

class ReviewService {
  async createReview(data: CreateReviewInput): Promise<FileReview> {
    try {
      // Verify file exists and belongs to requester
      const file = await db.fileSystemNode.findUnique({
        where: { id: data.fileId, userId: data.requesterId },
      });

      if (!file) {
        throw new ErrorNotFound("File not found or access denied");
      }

      // Verify reviewer is in same organization
      const reviewerMembership = await db.orgMembership.findFirst({
        where: { userId: data.reviewerId, orgId: data.orgId },
      });

      if (!reviewerMembership) {
        throw new ErrorValidation("Reviewer is not in your organization");
      }

      return await db.fileReview.create({
        data: {
          fileId: data.fileId,
          reviewerId: data.reviewerId,
          requesterId: data.requesterId,
          orgId: data.orgId,
          dueDate: data.dueDate,
          status: "PENDING",
        },
      });
    } catch (error) {
      console.error("Failed to create review:", error);
      throw error;
    }
  }

  async getReviewsForUser(
    userId: string,
    filters: { status?: FileReviewStatus }
  ) {
    try {
      return await db.fileReview.findMany({
        where: {
          OR: [{ reviewerId: userId }, { requesterId: userId }],
          status: filters.status,
        },
        include: {
          file: true,
          reviewer: true,
          requester: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      console.error("Failed to get reviews:", error);
      throw new Error("Failed to fetch reviews");
    }
  }

  async getReviewById(id: string, userId: string): Promise<FileReview> {
    try {
      const review = await db.fileReview.findUnique({
        where: { id },
        include: {
          fileReviewComments: {
            include: { user: true },
            orderBy: { createdAt: "asc" },
          },
          file: true,
          reviewer: true,
          requester: true,
        },
      });

      if (
        !review ||
        (review.reviewerId !== userId && review.requesterId !== userId)
      ) {
        throw new ErrorNotFound("Review not found or access denied");
      }

      return review;
    } catch (error) {
      console.error("Failed to get review:", error);
      throw error;
    }
  }

  async updateReviewStatus(
    id: string,
    userId: string,
    status: FileReviewStatus
  ): Promise<FileReview> {
    try {
      const review = await db.fileReview.findUnique({ where: { id } });

      if (!review || review.reviewerId !== userId) {
        throw new ErrorNotFound("Review not found or access denied");
      }

      return await db.fileReview.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      console.error("Failed to update review status:", error);
      throw error;
    }
  }

  async addComment(data: CreateCommentInput): Promise<ReviewComment> {
    try {
      const review = await db.fileReview.findUnique({
        where: { id: data.reviewId },
      });

      if (
        !review ||
        (review.reviewerId !== data.userId &&
          review.requesterId !== data.userId)
      ) {
        throw new ErrorNotFound("Review not found or access denied");
      }

      return await db.reviewComment.create({
        data: {
          fileReviewId: data.reviewId,
          userId: data.userId,
          content: data.content,
        },
        include: { user: true },
      });
    } catch (error) {
      console.error("Failed to add comment:", error);
      throw error;
    }
  }

  async resolveComment(
    commentId: string,
    userId: string
  ): Promise<ReviewComment> {
    try {
      const comment = await db.reviewComment.findUnique({
        where: { id: commentId },
        include: { fileReview: true },
      });

      if (!comment || comment.fileReview.reviewerId !== userId) {
        throw new ErrorNotFound("Comment not found or access denied");
      }

      return await db.reviewComment.update({
        where: { id: commentId },
        data: { resolved: true },
      });
    } catch (error) {
      console.error("Failed to resolve comment:", error);
      throw error;
    }
  }
}

export const reviewService = new ReviewService();
