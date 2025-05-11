import { db } from "@/app/api/lib/db";
import {
  FileReview,
  FileReviewComment,
  FileReviewStatus,
} from "@prisma/client";
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
      console.debug("Fetching file with ID:", data.fileId, "for requester:", data.requesterId);
      const file = await db.fileSystemNode.findUnique({
        where: { id: data.fileId, userId: data.requesterId },
      });

      if (!file) {
        console.error("File not found or access denied for file ID:", data.fileId);
        throw new ErrorNotFound("File not found or access denied");
      }

      console.debug("Verifying reviewer membership in organization:", data.orgId);
      const reviewerMembership = await db.orgMembership.findFirst({
        where: { userId: data.reviewerId, orgId: data.orgId },
      });

      if (!reviewerMembership) {
        console.error("Reviewer is not in the organization:", data.orgId);
        throw new ErrorValidation("Reviewer is not in your organization");
      }

      console.debug("Creating file review for file ID:", data.fileId);
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
    } catch {
      throw new Error("Failed to create review");
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
    } catch {
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
    } catch {
      throw new Error("Failed to get review:");
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
    } catch {
      throw new Error("Failed to update review status");
    }
  }

  async addComment(data: CreateCommentInput): Promise<FileReviewComment> {
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

      return await db.fileReviewComment.create({
        data: {
          fileReviewId: data.reviewId,
          userId: data.userId,
          content: data.content,
        },
        include: { user: true },
      });
    } catch {
      throw new Error("Failed to add comment");
    }
  }

  async resolveComment(
    commentId: string,
    userId: string
  ): Promise<FileReviewComment> {
    try {
      const comment = await db.fileReviewComment.findUnique({
        where: { id: commentId },
        include: { fileReview: true },
      });

      if (!comment || comment.fileReview.reviewerId !== userId) {
        throw new ErrorNotFound("Comment not found or access denied");
      }

      return await db.fileReviewComment.update({
        where: { id: commentId },
        data: { resolved: true },
      });
    } catch {
      throw new Error("Failed to resolve comment");
    }
  }
}

export const reviewService = new ReviewService();
