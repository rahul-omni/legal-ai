import { db } from "@/app/api/lib/db";
import { handleError } from "@/app/api/lib/errors";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { auth } from "@/app/api/lib/auth/nextAuthConfig";
import { ensureAssistantChatTables } from "../_lib/chatTables";

function toConversationSummary(conversation: any) {
  const lastMessage = conversation.messages?.[0];
  return {
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updatedAt,
    createdAt: conversation.createdAt,
    preview:
      typeof lastMessage?.content === "string"
        ? lastMessage.content.slice(0, 140)
        : "",
  };
}

async function getConversationsController(request: NextAuthRequest) {
  try {
    await ensureAssistantChatTables();
    const user = await userFromSession(request);
    const conversations = await (db as any).chatConversation.findMany({
      where: {
        userId: user.id,
        isArchived: false,
      },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
          },
        },
      },
    });

    return NextResponse.json({
      conversations: conversations.map(toConversationSummary),
    });
  } catch (error) {
    return handleError(error);
  }
}

async function createConversationController(
  request: NextAuthRequest
) {
  try {
    await ensureAssistantChatTables();
    const user = await userFromSession(request);
    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
    };
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 120)
        : "New conversation";

    const conversation = await (db as any).chatConversation.create({
      data: {
        userId: user.id,
        title,
      },
    });

    return NextResponse.json(
      {
        conversation: {
          id: conversation.id,
          title: conversation.title,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export const GET = auth(getConversationsController);
export const POST = auth(createConversationController);
