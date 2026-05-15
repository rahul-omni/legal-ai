import { db } from "@/app/api/lib/db";

let ensured = false;

async function safeExecute(query: string) {
  await db.$executeRawUnsafe(query);
}

export async function ensureAssistantChatTables() {
  if (ensured) return;

  await safeExecute(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'New conversation',
      is_archived BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  await safeExecute(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM')),
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  await safeExecute(`
    CREATE TABLE IF NOT EXISTS chat_conversation_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
      node_id UUID NOT NULL REFERENCES file_system_nodes(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      CONSTRAINT chat_conversation_node_unique UNIQUE (conversation_id, node_id)
    );
  `);

  await safeExecute(`
    CREATE TABLE IF NOT EXISTS chat_message_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
      node_id UUID NOT NULL REFERENCES file_system_nodes(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  await safeExecute(`
    ALTER TABLE chat_conversation_documents
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
  `);

  await safeExecute(`
    ALTER TABLE chat_conversations
      ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'AI_ASSISTANT',
      ADD COLUMN IF NOT EXISTS workspace_id UUID,
      ADD COLUMN IF NOT EXISTS file_id UUID,
      ADD COLUMN IF NOT EXISTS mode TEXT,
      ADD COLUMN IF NOT EXISTS thread_kind TEXT NOT NULL DEFAULT 'CUSTOM';
  `);

  await safeExecute(`
    UPDATE chat_conversations
    SET source = 'AI_ASSISTANT'
    WHERE source IS NULL OR source = '';
  `);

  await safeExecute(
    "CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_updated ON chat_conversations(user_id, updated_at DESC);"
  );
  await safeExecute(
    "CREATE INDEX IF NOT EXISTS chat_conversations_user_source_updated_idx ON chat_conversations(user_id, source, updated_at DESC);"
  );
  await safeExecute(
    "CREATE INDEX IF NOT EXISTS chat_conversations_user_source_context_idx ON chat_conversations(user_id, source, workspace_id, file_id);"
  );
  await safeExecute(`
    CREATE UNIQUE INDEX IF NOT EXISTS chat_conversations_legal_editor_default_key
    ON chat_conversations(user_id, source, workspace_id, file_id, mode, thread_kind)
    WHERE source = 'LEGAL_EDITOR'
      AND thread_kind = 'DEFAULT'
      AND workspace_id IS NOT NULL
      AND file_id IS NOT NULL
      AND mode IS NOT NULL;
  `);
  await safeExecute(
    "CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created ON chat_messages(conversation_id, created_at);"
  );
  await safeExecute(
    "CREATE INDEX IF NOT EXISTS idx_chat_conversation_documents_node_id ON chat_conversation_documents(node_id);"
  );
  await safeExecute(
    "CREATE INDEX IF NOT EXISTS idx_chat_conversation_documents_conversation_created ON chat_conversation_documents(conversation_id, created_at);"
  );
  await safeExecute(
    "CREATE INDEX IF NOT EXISTS idx_chat_conversation_documents_conversation_active_created ON chat_conversation_documents(conversation_id, is_active, created_at);"
  );
  await safeExecute(
    "CREATE INDEX IF NOT EXISTS idx_chat_message_documents_message_created ON chat_message_documents(message_id, created_at);"
  );
  await safeExecute(
    "CREATE INDEX IF NOT EXISTS idx_chat_message_documents_node_id ON chat_message_documents(node_id);"
  );

  ensured = true;
}
