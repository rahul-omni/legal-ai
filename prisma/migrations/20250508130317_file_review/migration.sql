-- CreateEnum
CREATE TYPE "FileReviewStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'COMPLETED', 'DECLINED');

-- CreateTable
CREATE TABLE "file_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "file_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "status" "FileReviewStatus" NOT NULL DEFAULT 'PENDING',
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "review_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "review_comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "file_reviews" ADD CONSTRAINT "file_reviews_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file_system_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_reviews" ADD CONSTRAINT "file_reviews_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_reviews" ADD CONSTRAINT "file_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_reviews" ADD CONSTRAINT "file_reviews_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "file_reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
