export interface CreateFileReviewRequest {
  fileId: string;
  reviewerId: string;
  orgId: string;
  dueDate?: string;
}