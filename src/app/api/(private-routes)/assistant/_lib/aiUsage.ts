import { db } from "@/app/api/lib/db";
import { assertAiUsageWithinLimits, ensureSubscriptionLimitSchema } from "@/app/api/lib/subscriptionLimits";

export type AiUsageFeature =
  | "AI_ASSISTANT_CHAT"
  | "LEGAL_EDITOR_CHAT"
  | "LEGAL_EDITOR_DOCUMENT"
  | "DOCUMENT_DRAFTING"
  | "TRANSLATION"
  | "OCR";

export function estimateTokens(value: string) {
  return Math.ceil((value || "").length / 4);
}

export async function ensureAiUsageTables() {
  await ensureSubscriptionLimitSchema();
  await db.$executeRawUnsafe(`
    ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS ai_token_limit INTEGER,
    ADD COLUMN IF NOT EXISTS ai_token_daily_limit INTEGER,
    ADD COLUMN IF NOT EXISTS ai_token_monthly_limit INTEGER,
    ADD COLUMN IF NOT EXISTS document_drafting_monthly_limit INTEGER,
    ADD COLUMN IF NOT EXISTS workspace_folder_file_limit INTEGER,
    ADD COLUMN IF NOT EXISTS workspace_limit INTEGER;
  `);
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ai_usage_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subscription_id UUID,
      feature TEXT NOT NULL,
      model TEXT NOT NULL,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS ai_usage_events_user_id_created_at_idx
    ON ai_usage_events(user_id, created_at);
  `);
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS ai_usage_events_subscription_id_created_at_idx
    ON ai_usage_events(subscription_id, created_at);
  `);
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS ai_usage_events_feature_created_at_idx
    ON ai_usage_events(feature, created_at);
  `);
}

export async function assertAiUsageAllowed(userId: string, estimatedTokens: number) {
  await ensureAiUsageTables();
  return assertAiUsageWithinLimits(userId, estimatedTokens);
}

export async function recordAiUsage(input: {
  userId: string;
  subscriptionId?: string | null;
  feature: AiUsageFeature;
  model: string;
  inputTokens: number;
  outputTokens: number;
  metadata?: Record<string, unknown>;
}) {
  await ensureAiUsageTables();
  const totalTokens = input.inputTokens + input.outputTokens;

  await db.$executeRaw`
    INSERT INTO "ai_usage_events" (
      "user_id",
      "subscription_id",
      "feature",
      "model",
      "input_tokens",
      "output_tokens",
      "total_tokens",
      "metadata"
    )
    VALUES (
      ${input.userId}::uuid,
      ${input.subscriptionId ?? null}::uuid,
      ${input.feature},
      ${input.model},
      ${input.inputTokens},
      ${input.outputTokens},
      ${totalTokens},
      ${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb
    );
  `;
}
