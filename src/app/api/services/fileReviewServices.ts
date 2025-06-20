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
  //reviewerEmail: string;
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
    console.log("Starting review creation with:", data);

    // 1. Validate input
    if (!data.fileId || !data.requesterId || !data.reviewerId || !data.orgId) {
      throw new Error("Missing required fields");
    }

    // 3. Verify file access
    const file = await db.fileSystemNode.findFirst({
      where: {
        id: data.fileId,
        userId: data.requesterId,
      },
    });

    if (!file) {
      throw new Error("File not found or access denied");
    }

    // 4. Verify organization permissions
    const isAuthorized = await db.orgMembership.findFirst({
      where: {
        userId: data.reviewerId,
        orgId: data.orgId,
      },
    });

    if (!isAuthorized) {
      throw new Error("Reviewer is not a member of this organization");
    }

    // 5. Create the review
    console.log("Creating review with reviewerId:", data.reviewerId);

    const newReview = await db.fileReview.create({
      data: {
        fileId: data.fileId,
        reviewerId: data.reviewerId,
        requesterId: data.requesterId,
        orgId: data.orgId,
        dueDate: data.dueDate,
        status: "PENDING",
      },
    });

    console.log("Review created successfully:", newReview);
    return newReview;
  }

  async getFullReviews(userId: string) {
    const reviews = await db.fileReview.findMany({
      where: {
        reviewerId: userId, // Filter by reviewerId
      },
      include: {
        file: {
          select: {
            id: true, // File ID from FileSystemNode
            name: true, // Name of the file
            content: true, // Content of the file (if present)
            type: true, // Type (FILE or FOLDER)
            parentId: true, // Parent ID if it's part of a folder structure
            createdAt: true, // Creation date
            updatedAt: true, // Last updated date

            createdBy: true,
            user: {
              select: {
                id: true, // User ID
                name: true, // User name
                email: true, // User email
                mobileNumber: true, // User mobile number
                createdAt: true, // User creation date
                updatedAt: true, // User last updated date
                countryCode: true, // User country code
              },
            },
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    
   
    return reviews;
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
     console.log('Attempting to add comment with data:', data);
    try {
      const review = await db.fileReview.findUnique({
        where: { id: data.reviewId },
      });
      console.log('Found review:', review);
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
        include: { user: 
          {
            select: {
              id: true,
              name: true,
              email: true,
              mobileNumber: true,
              countryCode: true,
            },
          },
         },
      });
    } catch {
      throw new Error("Failed to add comment");
    }
  }

  
}

export const reviewService = new ReviewService();
