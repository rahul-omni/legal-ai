import { db } from "@/app/api/lib/db";
import { ensureSubscriptionLimitSchema } from "@/app/api/lib/subscriptionLimits";
import { ErrorNotFound } from "../lib/errors";

export type SubscriptionPlanRecord = {
  id: string;
  title: string;
  description: string | null;
  features: string[];
  aiTokenLimit: number | null;
  aiTokenDailyLimit: number | null;
  aiTokenMonthlyLimit: number | null;
  documentDraftingMonthlyLimit: number | null;
  workspaceFolderFileLimit: number | null;
  workspaceLimit: number | null;
  discountedPrice: number;
  discounted: number;
  price: number;
  duration: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type PlanInput = {
  title: string;
  description?: string;
  features: string[];
  aiTokenLimit?: number | null;
  aiTokenDailyLimit?: number | null;
  aiTokenMonthlyLimit?: number | null;
  documentDraftingMonthlyLimit?: number | null;
  workspaceFolderFileLimit?: number | null;
  workspaceLimit?: number | null;
  discountedPrice: number;
  discounted: number;
  price: number;
  duration?: number;
  isActive?: boolean;
};

class SubscriptionPlanService {
  /**
   * Get all active subscription plans
   */
  async getActivePlans(): Promise<SubscriptionPlanRecord[]> {
    try {
      await ensureSubscriptionLimitSchema();
      return await db.$queryRaw<SubscriptionPlanRecord[]>`
        SELECT
          "id",
          "title",
          "description",
          "features",
          "ai_token_limit" AS "aiTokenLimit",
          "ai_token_daily_limit" AS "aiTokenDailyLimit",
          "ai_token_monthly_limit" AS "aiTokenMonthlyLimit",
          "document_drafting_monthly_limit" AS "documentDraftingMonthlyLimit",
          "workspace_folder_file_limit" AS "workspaceFolderFileLimit",
          "workspace_limit" AS "workspaceLimit",
          "discountedPrice",
          "discounted",
          "price",
          "duration",
          "isActive",
          "createdAt",
          "updatedAt"
        FROM "subscription_plans"
        WHERE "isActive" = true
        ORDER BY "price" ASC;
      `;
    } catch {
      throw new Error("Failed to fetch subscription plans");
    }
  }

  /**
   * Get all subscription plans (including inactive)
   */
  async getAllPlans(): Promise<SubscriptionPlanRecord[]> {
    try {
      await ensureSubscriptionLimitSchema();
      return await db.$queryRaw<SubscriptionPlanRecord[]>`
        SELECT
          "id",
          "title",
          "description",
          "features",
          "ai_token_limit" AS "aiTokenLimit",
          "ai_token_daily_limit" AS "aiTokenDailyLimit",
          "ai_token_monthly_limit" AS "aiTokenMonthlyLimit",
          "document_drafting_monthly_limit" AS "documentDraftingMonthlyLimit",
          "workspace_folder_file_limit" AS "workspaceFolderFileLimit",
          "workspace_limit" AS "workspaceLimit",
          "discountedPrice",
          "discounted",
          "price",
          "duration",
          "isActive",
          "createdAt",
          "updatedAt"
        FROM "subscription_plans"
        ORDER BY "price" ASC;
      `;
    } catch {
      throw new Error("Failed to fetch subscription plans");
    }
  }

  /**
   * Get subscription plan by ID
   */
  async getPlanById(id: string): Promise<SubscriptionPlanRecord | null> {
    try {
      await ensureSubscriptionLimitSchema();
      const rows = await db.$queryRaw<SubscriptionPlanRecord[]>`
        SELECT
          "id",
          "title",
          "description",
          "features",
          "ai_token_limit" AS "aiTokenLimit",
          "ai_token_daily_limit" AS "aiTokenDailyLimit",
          "ai_token_monthly_limit" AS "aiTokenMonthlyLimit",
          "document_drafting_monthly_limit" AS "documentDraftingMonthlyLimit",
          "workspace_folder_file_limit" AS "workspaceFolderFileLimit",
          "workspace_limit" AS "workspaceLimit",
          "discountedPrice",
          "discounted",
          "price",
          "duration",
          "isActive",
          "createdAt",
          "updatedAt"
        FROM "subscription_plans"
        WHERE "id" = ${id}::uuid
        LIMIT 1;
      `;
      return rows[0] ?? null;
    } catch {
      throw new Error("Failed to find subscription plan");
    }
  }

  /**
   * Create a new subscription plan
   */
  async createPlan(data: PlanInput): Promise<SubscriptionPlanRecord> {
    try {
      await ensureSubscriptionLimitSchema();
      const rows = await db.$queryRaw<SubscriptionPlanRecord[]>`
        INSERT INTO "subscription_plans" (
          "title",
          "description",
          "features",
          "ai_token_limit",
          "ai_token_daily_limit",
          "ai_token_monthly_limit",
          "document_drafting_monthly_limit",
          "workspace_folder_file_limit",
          "workspace_limit",
          "discountedPrice",
          "discounted",
          "price",
          "duration",
          "isActive",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          ${data.title},
          ${data.description || null},
          ${data.features}::text[],
          ${data.aiTokenLimit ?? null},
          ${data.aiTokenDailyLimit ?? null},
          ${data.aiTokenMonthlyLimit ?? null},
          ${data.documentDraftingMonthlyLimit ?? null},
          ${data.workspaceFolderFileLimit ?? null},
          ${data.workspaceLimit ?? null},
          ${data.discountedPrice},
          ${data.discounted},
          ${data.price},
          ${data.duration || null},
          ${data.isActive !== undefined ? data.isActive : true},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING
          "id",
          "title",
          "description",
          "features",
          "ai_token_limit" AS "aiTokenLimit",
          "ai_token_daily_limit" AS "aiTokenDailyLimit",
          "ai_token_monthly_limit" AS "aiTokenMonthlyLimit",
          "document_drafting_monthly_limit" AS "documentDraftingMonthlyLimit",
          "workspace_folder_file_limit" AS "workspaceFolderFileLimit",
          "workspace_limit" AS "workspaceLimit",
          "discountedPrice",
          "discounted",
          "price",
          "duration",
          "isActive",
          "createdAt",
          "updatedAt";
      `;
      return rows[0];
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      throw new Error("Failed to create subscription plan");
    }
  }

  /**
   * Update subscription plan
   */
  async updatePlan(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      features: string[];
      discountedPrice: number;
      discounted: number;
      price: number;
      duration: number;
      isActive: boolean;
      aiTokenLimit: number | null;
      aiTokenDailyLimit: number | null;
      aiTokenMonthlyLimit: number | null;
      documentDraftingMonthlyLimit: number | null;
      workspaceFolderFileLimit: number | null;
      workspaceLimit: number | null;
    }>
  ): Promise<SubscriptionPlanRecord> {
    try {
      await ensureSubscriptionLimitSchema();
      const current = await this.getPlanById(id);
      if (!current) throw new ErrorNotFound("Subscription plan");

      const next = { ...current, ...data };
      const rows = await db.$queryRaw<SubscriptionPlanRecord[]>`
        UPDATE "subscription_plans"
        SET
          "title" = ${next.title},
          "description" = ${next.description},
          "features" = ${next.features}::text[],
          "ai_token_limit" = ${next.aiTokenLimit},
          "ai_token_daily_limit" = ${next.aiTokenDailyLimit},
          "ai_token_monthly_limit" = ${next.aiTokenMonthlyLimit},
          "document_drafting_monthly_limit" = ${next.documentDraftingMonthlyLimit},
          "workspace_folder_file_limit" = ${next.workspaceFolderFileLimit},
          "workspace_limit" = ${next.workspaceLimit},
          "discountedPrice" = ${next.discountedPrice},
          "discounted" = ${next.discounted},
          "price" = ${next.price},
          "duration" = ${next.duration},
          "isActive" = ${next.isActive},
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${id}::uuid
        RETURNING
          "id",
          "title",
          "description",
          "features",
          "ai_token_limit" AS "aiTokenLimit",
          "ai_token_daily_limit" AS "aiTokenDailyLimit",
          "ai_token_monthly_limit" AS "aiTokenMonthlyLimit",
          "document_drafting_monthly_limit" AS "documentDraftingMonthlyLimit",
          "workspace_folder_file_limit" AS "workspaceFolderFileLimit",
          "workspace_limit" AS "workspaceLimit",
          "discountedPrice",
          "discounted",
          "price",
          "duration",
          "isActive",
          "createdAt",
          "updatedAt";
      `;
      return rows[0];
    } catch {
      throw new ErrorNotFound("Subscription plan not found");
    }
  }

  /**
   * Delete subscription plan
   */
  async deletePlan(id: string): Promise<SubscriptionPlanRecord> {
    try {
      const rows = await db.$queryRaw<SubscriptionPlanRecord[]>`
        DELETE FROM "subscription_plans"
        WHERE "id" = ${id}::uuid
        RETURNING
          "id",
          "title",
          "description",
          "features",
          "ai_token_limit" AS "aiTokenLimit",
          "ai_token_daily_limit" AS "aiTokenDailyLimit",
          "ai_token_monthly_limit" AS "aiTokenMonthlyLimit",
          "document_drafting_monthly_limit" AS "documentDraftingMonthlyLimit",
          "workspace_folder_file_limit" AS "workspaceFolderFileLimit",
          "workspace_limit" AS "workspaceLimit",
          "discountedPrice",
          "discounted",
          "price",
          "duration",
          "isActive",
          "createdAt",
          "updatedAt";
      `;
      if (!rows[0]) throw new ErrorNotFound("Subscription plan");
      return rows[0];
    } catch {
      throw new ErrorNotFound("Subscription plan not found");
    }
  }
}

// Export default instance for easier usage
export const subscriptionPlanService = new SubscriptionPlanService();

