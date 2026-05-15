import { db } from "./db";

type NullableNumber = number | bigint | null;

export type EffectiveSubscriptionPlan = {
  subscriptionId: string | null;
  planId: string | null;
  title: string;
  aiTokenLimit: number | null;
  aiTokenDailyLimit: number | null;
  aiTokenMonthlyLimit: number | null;
  documentDraftingMonthlyLimit: number | null;
  workspaceFolderFileLimit: number | null;
  workspaceLimit: number | null;
};

type EffectivePlanRow = {
  subscriptionId: string | null;
  planId: string | null;
  title: string;
  aiTokenLimit: NullableNumber;
  aiTokenDailyLimit: NullableNumber;
  aiTokenMonthlyLimit: NullableNumber;
  documentDraftingMonthlyLimit: NullableNumber;
  workspaceFolderFileLimit: NullableNumber;
  workspaceLimit: NullableNumber;
};

function toNumber(value: NullableNumber) {
  return value === null ? null : Number(value);
}

function toEffectivePlan(row: EffectivePlanRow): EffectiveSubscriptionPlan {
  const monthlyLimit = toNumber(row.aiTokenMonthlyLimit) ?? toNumber(row.aiTokenLimit);

  return {
    subscriptionId: row.subscriptionId,
    planId: row.planId,
    title: row.title,
    aiTokenLimit: toNumber(row.aiTokenLimit),
    aiTokenDailyLimit: toNumber(row.aiTokenDailyLimit),
    aiTokenMonthlyLimit: monthlyLimit,
    documentDraftingMonthlyLimit: toNumber(row.documentDraftingMonthlyLimit),
    workspaceFolderFileLimit: toNumber(row.workspaceFolderFileLimit),
    workspaceLimit: toNumber(row.workspaceLimit),
  };
}

function limitError(message: string) {
  const error = new Error(message);
  (error as Error & { status?: number }).status = 403;
  return error;
}

export async function ensureSubscriptionLimitSchema() {
  await db.$executeRawUnsafe(`
    ALTER TABLE "subscription_plans"
      ADD COLUMN IF NOT EXISTS "ai_token_limit" INTEGER,
      ADD COLUMN IF NOT EXISTS "ai_token_daily_limit" INTEGER,
      ADD COLUMN IF NOT EXISTS "ai_token_monthly_limit" INTEGER,
      ADD COLUMN IF NOT EXISTS "document_drafting_monthly_limit" INTEGER,
      ADD COLUMN IF NOT EXISTS "workspace_folder_file_limit" INTEGER,
      ADD COLUMN IF NOT EXISTS "workspace_limit" INTEGER;
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "user_subscriptions"
      ALTER COLUMN "payment_id" DROP NOT NULL;
  `);
}

async function getActiveSubscriptionRows(userId: string) {
  return db.$queryRaw<EffectivePlanRow[]>`
    SELECT
      us."id" AS "subscriptionId",
      sp."id" AS "planId",
      sp."title",
      sp."ai_token_limit" AS "aiTokenLimit",
      sp."ai_token_daily_limit" AS "aiTokenDailyLimit",
      sp."ai_token_monthly_limit" AS "aiTokenMonthlyLimit",
      sp."document_drafting_monthly_limit" AS "documentDraftingMonthlyLimit",
      sp."workspace_folder_file_limit" AS "workspaceFolderFileLimit",
      sp."workspace_limit" AS "workspaceLimit"
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
}

async function ensureFreeSubscriptionForUser(userId: string) {
  const freeRows = await db.$queryRaw<{ id: string; duration: number | null }[]>`
    SELECT
      "id",
      "duration"
    FROM "subscription_plans"
    WHERE "isActive" = true
      AND lower("title") = 'free'
    ORDER BY "price" ASC, "createdAt" ASC
    LIMIT 1;
  `;
  const freePlan = freeRows[0];

  if (!freePlan) {
    const error = new Error("Free subscription plan is not configured.");
    (error as Error & { status?: number }).status = 500;
    throw error;
  }

  await db.$executeRaw`
    INSERT INTO "user_subscriptions" (
      "user_id",
      "subscription_plan_id",
      "payment_id",
      "status",
      "start_date",
      "end_date",
      "auto_renew",
      "created_at",
      "updated_at"
    )
    SELECT
      ${userId}::uuid,
      ${freePlan.id}::uuid,
      NULL::uuid,
      'ACTIVE'::"SubscriptionStatus",
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP + (COALESCE(${freePlan.duration}, 36500) * INTERVAL '1 day'),
      false,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
      SELECT 1
      FROM "user_subscriptions" us
      INNER JOIN "subscription_plans" sp ON sp."id" = us."subscription_plan_id"
      WHERE us."user_id" = ${userId}::uuid
        AND us."status" = 'ACTIVE'
        AND us."start_date" <= CURRENT_TIMESTAMP
        AND us."end_date" >= CURRENT_TIMESTAMP
        AND sp."isActive" = true
    );
  `;
}

export async function getEffectiveSubscriptionPlan(userId: string): Promise<EffectiveSubscriptionPlan> {
  await ensureSubscriptionLimitSchema();

  let activeRows = await getActiveSubscriptionRows(userId);

  if (activeRows[0]) {
    return toEffectivePlan(activeRows[0]);
  }

  await ensureFreeSubscriptionForUser(userId);
  activeRows = await getActiveSubscriptionRows(userId);

  if (!activeRows[0]) {
    const error = new Error("Unable to assign Free subscription plan.");
    (error as Error & { status?: number }).status = 500;
    throw error;
  }

  return toEffectivePlan(activeRows[0]);
}

export async function assertAiUsageWithinLimits(userId: string, estimatedTokens: number) {
  const plan = await getEffectiveSubscriptionPlan(userId);

  if (plan.aiTokenDailyLimit) {
    const dailyRows = await db.$queryRaw<{ totalTokens: NullableNumber }[]>`
      SELECT COALESCE(SUM("total_tokens"), 0) AS "totalTokens"
      FROM "ai_usage_events"
      WHERE "user_id" = ${userId}::uuid
        AND "created_at" >= date_trunc('day', CURRENT_TIMESTAMP);
    `;
    const usedToday = Number(dailyRows[0]?.totalTokens ?? 0);
    if (usedToday + estimatedTokens > plan.aiTokenDailyLimit) {
      throw limitError(`Daily AI token limit reached for your ${plan.title} plan.`);
    }
  }

  if (plan.aiTokenMonthlyLimit) {
    const monthlyRows = await db.$queryRaw<{ totalTokens: NullableNumber }[]>`
      SELECT COALESCE(SUM("total_tokens"), 0) AS "totalTokens"
      FROM "ai_usage_events"
      WHERE "user_id" = ${userId}::uuid
        AND "created_at" >= date_trunc('month', CURRENT_TIMESTAMP);
    `;
    const usedThisMonth = Number(monthlyRows[0]?.totalTokens ?? 0);
    if (usedThisMonth + estimatedTokens > plan.aiTokenMonthlyLimit) {
      throw limitError(`Monthly AI token limit reached for your ${plan.title} plan.`);
    }
  }

  return {
    subscriptionId: plan.subscriptionId,
    remainingTokens: plan.aiTokenMonthlyLimit,
    plan,
  };
}

export async function assertDocumentDraftingAllowed(userId: string) {
  const plan = await getEffectiveSubscriptionPlan(userId);
  if (!plan.documentDraftingMonthlyLimit) {
    return { subscriptionId: plan.subscriptionId, plan };
  }

  const usageRows = await db.$queryRaw<{ usageCount: NullableNumber }[]>`
    SELECT COUNT(*) AS "usageCount"
    FROM "ai_usage_events"
    WHERE "user_id" = ${userId}::uuid
      AND "feature" = 'DOCUMENT_DRAFTING'
      AND "created_at" >= date_trunc('month', CURRENT_TIMESTAMP);
  `;
  const usageCount = Number(usageRows[0]?.usageCount ?? 0);

  if (usageCount >= plan.documentDraftingMonthlyLimit) {
    throw limitError(`Monthly document drafting limit reached for your ${plan.title} plan.`);
  }

  return { subscriptionId: plan.subscriptionId, plan };
}

export async function assertWorkspaceLimitAllowsNew(userId: string) {
  const plan = await getEffectiveSubscriptionPlan(userId);
  if (!plan.workspaceLimit) {
    return { subscriptionId: plan.subscriptionId, plan };
  }

  const countRows = await db.$queryRaw<{ activeCount: NullableNumber }[]>`
    SELECT COUNT(*) AS "activeCount"
    FROM "subscribed_cases"
    WHERE "user_id" = ${userId}::uuid
      AND "status" = 'ACTIVE';
  `;
  const activeCount = Number(countRows[0]?.activeCount ?? 0);

  if (activeCount >= plan.workspaceLimit) {
    throw limitError(`Workspace limit reached for your ${plan.title} plan. Upgrade to subscribe more cases.`);
  }

  return { subscriptionId: plan.subscriptionId, plan };
}

export async function getSubscriptionAccessByIds(userId: string, subscriptionIds: string[]) {
  const accessMap = new Map<string, { isLocked: boolean; lockReason: string | null; position: number | null; limit: number | null }>();
  const uniqueIds = Array.from(new Set(subscriptionIds.filter(Boolean)));

  if (uniqueIds.length === 0) return accessMap;

  const plan = await getEffectiveSubscriptionPlan(userId);
  if (!plan.workspaceLimit) {
    uniqueIds.forEach((id) => accessMap.set(id, { isLocked: false, lockReason: null, position: null, limit: null }));
    return accessMap;
  }

  const rows = await db.$queryRaw<{ id: string; position: NullableNumber }[]>`
    WITH ranked_subscriptions AS (
      SELECT
        sc."id",
        ROW_NUMBER() OVER (ORDER BY sc."created_at" DESC, sc."id" DESC) AS "position"
      FROM "subscribed_cases" sc
      WHERE sc."user_id" = ${userId}::uuid
        AND sc."status" = 'ACTIVE'
    )
    SELECT "id", "position"
    FROM ranked_subscriptions
    WHERE "id" = ANY(${uniqueIds}::uuid[]);
  `;

  for (const id of uniqueIds) {
    const row = rows.find((item) => item.id === id);
    const position = row ? Number(row.position) : null;
    const isLocked = position !== null && position > plan.workspaceLimit;
    accessMap.set(id, {
      isLocked,
      lockReason: isLocked ? `${plan.title} plan allows ${plan.workspaceLimit} active workspaces. Upgrade to unlock this older workspace.` : null,
      position,
      limit: plan.workspaceLimit,
    });
  }

  return accessMap;
}

export async function assertSubscribedCaseAccessAllowed(userId: string, subscribedCaseId: string) {
  const access = await getSubscriptionAccessByIds(userId, [subscribedCaseId]);
  const result = access.get(subscribedCaseId);
  if (result?.isLocked) {
    throw limitError(result.lockReason || "This workspace is locked by your subscription plan.");
  }
}

export async function assertWorkspaceAccessAllowed(userId: string, workspaceId: string) {
  const rows = await db.$queryRaw<{ subscribedCaseId: string }[]>`
    SELECT w."subscribed_case_id" AS "subscribedCaseId"
    FROM "workspaces" w
    INNER JOIN "subscribed_cases" sc ON sc."id" = w."subscribed_case_id"
    WHERE w."id" = ${workspaceId}::uuid
      AND w."user_id" = ${userId}::uuid
      AND sc."status" = 'ACTIVE'
    LIMIT 1;
  `;

  if (rows[0]?.subscribedCaseId) {
    await assertSubscribedCaseAccessAllowed(userId, rows[0].subscribedCaseId);
  }
}

export async function assertWorkspaceFolderFileLimitAllows(userId: string, parentId: string | null, additionalFiles = 1) {
  if (!parentId || additionalFiles <= 0) return;

  const plan = await getEffectiveSubscriptionPlan(userId);
  if (!plan.workspaceFolderFileLimit) return;

  const rootRows = await db.$queryRaw<{ workspaceId: string; rootId: string }[]>`
    WITH RECURSIVE ancestors AS (
      SELECT fsn."id", fsn."parent_id"
      FROM "file_system_nodes" fsn
      WHERE fsn."id" = ${parentId}::uuid
        AND fsn."user_id" = ${userId}::uuid
      UNION ALL
      SELECT parent."id", parent."parent_id"
      FROM "file_system_nodes" parent
      INNER JOIN ancestors child ON child."parent_id" = parent."id"
      WHERE parent."user_id" = ${userId}::uuid
    )
    SELECT
      w."id" AS "workspaceId",
      w."project_folder_id" AS "rootId"
    FROM "workspaces" w
    INNER JOIN ancestors a ON a."id" = w."project_folder_id"
    WHERE w."user_id" = ${userId}::uuid
    LIMIT 1;
  `;

  const root = rootRows[0];
  if (!root?.rootId) return;

  await assertWorkspaceAccessAllowed(userId, root.workspaceId);

  const countRows = await db.$queryRaw<{ fileCount: NullableNumber }[]>`
    WITH RECURSIVE descendants AS (
      SELECT fsn."id", fsn."type"
      FROM "file_system_nodes" fsn
      WHERE fsn."id" = ${root.rootId}::uuid
        AND fsn."user_id" = ${userId}::uuid
      UNION ALL
      SELECT child."id", child."type"
      FROM "file_system_nodes" child
      INNER JOIN descendants parent ON child."parent_id" = parent."id"
      WHERE child."user_id" = ${userId}::uuid
    )
    SELECT COUNT(*) AS "fileCount"
    FROM descendants
    WHERE "type" = 'FILE'::"FileType";
  `;
  const fileCount = Number(countRows[0]?.fileCount ?? 0);

  if (fileCount + additionalFiles > plan.workspaceFolderFileLimit) {
    throw limitError(`Workspace file limit reached for your ${plan.title} plan.`);
  }
}
