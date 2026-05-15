import { db } from "@/app/api/lib/db";
import { getEffectiveSubscriptionPlan } from "@/app/api/lib/subscriptionLimits";
import { UserSubscription, SubscriptionStatus } from "@prisma/client";
import { ErrorNotFound } from "../lib/errors";
import { Transaction } from "../types";

interface CreateSubscriptionInput {
  userId: string;
  subscriptionPlanId: string;
  paymentId: string;
  autoRenew?: boolean;
}

class UserSubscriptionService {
  /**
   * Create a new user subscription
   * Calculates endDate based on plan duration (in days)
   */
  async createSubscription(
    data: CreateSubscriptionInput,
    tx?: Transaction
  ): Promise<UserSubscription> {
    try {
      const prisma = tx || db;

      // Get the subscription plan to calculate end date
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: data.subscriptionPlanId },
      });

      if (!plan) {
        throw new ErrorNotFound("Subscription plan not found");
      }

      // Calculate end date based on duration (in days)
      const startDate = new Date();
      const endDate = new Date(startDate);
      
      if (plan.duration) {
        endDate.setDate(endDate.getDate() + plan.duration);
      } else {
        // Default to 30 days if no duration specified
        endDate.setDate(endDate.getDate() + 30);
      }

      // Optionally expire any existing active subscriptions for this user
      // This ensures only one active subscription at a time
      await prisma.userSubscription.updateMany({
        where: {
          userId: data.userId,
          status: SubscriptionStatus.ACTIVE,
        },
        data: {
          status: SubscriptionStatus.EXPIRED,
        },
      });

      // Create new subscription
      return await prisma.userSubscription.create({
        data: {
          userId: data.userId,
          subscriptionPlanId: data.subscriptionPlanId,
          paymentId: data.paymentId,
          status: SubscriptionStatus.ACTIVE,
          startDate,
          endDate,
          autoRenew: data.autoRenew || false,
        },
        include: {
          subscriptionPlan: true,
          payment: true,
        },
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      if (error instanceof ErrorNotFound) {
        throw error;
      }
      throw new Error("Failed to create subscription");
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(id: string): Promise<UserSubscription | null> {
    try {
      return await db.userSubscription.findUnique({
        where: { id },
        include: {
          subscriptionPlan: true,
          payment: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch {
      throw new Error("Failed to find subscription");
    }
  }

  /**
   * Get active subscription for a user
   */
  async getActiveSubscription(userId: string): Promise<any | null> {
    try {
      const rows = await db.$queryRaw<any[]>`
        SELECT
          us."id",
          us."user_id" AS "userId",
          us."subscription_plan_id" AS "subscriptionPlanId",
          us."payment_id" AS "paymentId",
          us."status"::text AS "status",
          us."start_date" AS "startDate",
          us."end_date" AS "endDate",
          us."auto_renew" AS "autoRenew",
          us."created_at" AS "createdAt",
          us."updated_at" AS "updatedAt",
          jsonb_build_object(
            'id', sp."id",
            'title', sp."title",
            'description', sp."description",
            'features', sp."features",
            'discountedPrice', sp."discountedPrice",
            'price', sp."price",
            'duration', sp."duration",
            'aiTokenDailyLimit', sp."ai_token_daily_limit",
            'aiTokenMonthlyLimit', sp."ai_token_monthly_limit",
            'documentDraftingMonthlyLimit', sp."document_drafting_monthly_limit",
            'workspaceFolderFileLimit', sp."workspace_folder_file_limit",
            'workspaceLimit', sp."workspace_limit"
          ) AS "subscriptionPlan"
        FROM "user_subscriptions" us
        INNER JOIN "subscription_plans" sp ON sp."id" = us."subscription_plan_id"
        WHERE us."user_id" = ${userId}::uuid
          AND us."status" = 'ACTIVE'
          AND us."start_date" <= CURRENT_TIMESTAMP
          AND us."end_date" >= CURRENT_TIMESTAMP
          AND sp."isActive" = true
        ORDER BY us."created_at" DESC
        LIMIT 1;
      `;

      if (rows[0]) return rows[0];

      await getEffectiveSubscriptionPlan(userId);

      const fallbackRows = await db.$queryRaw<any[]>`
        SELECT
          us."id",
          us."user_id" AS "userId",
          us."subscription_plan_id" AS "subscriptionPlanId",
          us."payment_id" AS "paymentId",
          us."status"::text AS "status",
          us."start_date" AS "startDate",
          us."end_date" AS "endDate",
          us."auto_renew" AS "autoRenew",
          us."created_at" AS "createdAt",
          us."updated_at" AS "updatedAt",
          jsonb_build_object(
            'id', sp."id",
            'title', sp."title",
            'description', sp."description",
            'features', sp."features",
            'discountedPrice', sp."discountedPrice",
            'price', sp."price",
            'duration', sp."duration",
            'aiTokenDailyLimit', sp."ai_token_daily_limit",
            'aiTokenMonthlyLimit', sp."ai_token_monthly_limit",
            'documentDraftingMonthlyLimit', sp."document_drafting_monthly_limit",
            'workspaceFolderFileLimit', sp."workspace_folder_file_limit",
            'workspaceLimit', sp."workspace_limit"
          ) AS "subscriptionPlan"
        FROM "user_subscriptions" us
        INNER JOIN "subscription_plans" sp ON sp."id" = us."subscription_plan_id"
        WHERE us."user_id" = ${userId}::uuid
          AND us."status" = 'ACTIVE'
          AND us."start_date" <= CURRENT_TIMESTAMP
          AND us."end_date" >= CURRENT_TIMESTAMP
          AND sp."isActive" = true
        ORDER BY us."created_at" DESC
        LIMIT 1;
      `;

      return fallbackRows[0] ?? null;
    } catch (error) {
      console.error("Error finding active subscription:", error);
      throw new Error("Failed to find active subscription");
    }
  }

  /**
   * Get all subscriptions for a user
   */
  async getSubscriptionsByUserId(userId: string): Promise<any[]> {
    try {
      return await db.$queryRaw<any[]>`
        SELECT
          us."id",
          us."user_id" AS "userId",
          us."subscription_plan_id" AS "subscriptionPlanId",
          us."payment_id" AS "paymentId",
          us."status"::text AS "status",
          us."start_date" AS "startDate",
          us."end_date" AS "endDate",
          us."auto_renew" AS "autoRenew",
          us."created_at" AS "createdAt",
          us."updated_at" AS "updatedAt",
          jsonb_build_object(
            'id', sp."id",
            'title', sp."title",
            'description', sp."description",
            'features', sp."features",
            'discountedPrice', sp."discountedPrice",
            'price', sp."price",
            'duration', sp."duration",
            'aiTokenDailyLimit', sp."ai_token_daily_limit",
            'aiTokenMonthlyLimit', sp."ai_token_monthly_limit",
            'documentDraftingMonthlyLimit', sp."document_drafting_monthly_limit",
            'workspaceFolderFileLimit', sp."workspace_folder_file_limit",
            'workspaceLimit', sp."workspace_limit"
          ) AS "subscriptionPlan",
          CASE
            WHEN p."id" IS NULL THEN NULL
            ELSE jsonb_build_object(
              'id', p."id",
              'status', p."status",
              'razorpayPaymentId', p."razorpay_payment_id",
              'razorpayOrderId', p."razorpay_order_id",
              'createdAt', p."created_at",
              'updatedAt', p."updated_at"
            )
          END AS "payment"
        FROM "user_subscriptions" us
        INNER JOIN "subscription_plans" sp ON sp."id" = us."subscription_plan_id"
        LEFT JOIN "payments" p ON p."id" = us."payment_id"
        WHERE us."user_id" = ${userId}::uuid
        ORDER BY us."created_at" DESC;
      `;
    } catch (error) {
      console.error("Error finding subscriptions by user ID:", error);
      throw new Error("Failed to find subscriptions by user ID");
    }
  }

  /**
   * Check if user has an active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getActiveSubscription(userId);
      return subscription !== null;
    } catch {
      return false;
    }
  }

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(
    id: string,
    status: SubscriptionStatus,
    tx?: Transaction
  ): Promise<UserSubscription> {
    try {
      const prisma = tx || db;
      return await prisma.userSubscription.update({
        where: { id },
        data: { status },
      });
    } catch {
      throw new ErrorNotFound("Subscription not found");
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(id: string): Promise<UserSubscription> {
    try {
      return await db.userSubscription.update({
        where: { id },
        data: { status: SubscriptionStatus.CANCELLED },
      });
    } catch {
      throw new ErrorNotFound("Subscription not found");
    }
  }

  /**
   * Expire subscriptions that have passed their end date
   * This should be called by a cron job
   */
  async expireSubscriptions(): Promise<number> {
    try {
      const now = new Date();
      const result = await db.userSubscription.updateMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          endDate: {
            lte: now, // endDate is in the past or today
          },
        },
        data: {
          status: SubscriptionStatus.EXPIRED,
        },
      });
      return result.count;
    } catch (error) {
      console.error("Error expiring subscriptions:", error);
      throw new Error("Failed to expire subscriptions");
    }
  }

  /**
   * Get subscriptions expiring soon (within specified days)
   */
  async getSubscriptionsExpiringSoon(days: number = 7): Promise<UserSubscription[]> {
    try {
      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + days);

      return await db.userSubscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          endDate: {
            gte: now,
            lte: futureDate,
          },
        },
        include: {
          subscriptionPlan: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          endDate: "asc",
        },
      });
    } catch {
      throw new Error("Failed to find expiring subscriptions");
    }
  }
}

// Export default instance for easier usage
export const userSubscriptionService = new UserSubscriptionService();

