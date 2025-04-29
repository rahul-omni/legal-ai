import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendInviteEmail } from "../lib/mail";
import { createInvitation } from "../lib/services/invitationService";

// Define request validation schema
const InviteRequestSchema = z.object({
  email: z.string().email(),
  orgId: z.string().uuid(),
  roleId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = InviteRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { errMsg: "Invalid request data", errors: validation.error.errors },
        { status: 400 }
      );
    }

    // Use the service to handle database operations
    const invitationResult = await createInvitation(validation.data);

    // Send invitation email
    sendInviteEmail(
      invitationResult.email,
      invitationResult.token,
      invitationResult.orgName!,
      invitationResult.roleId
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in invite POST handler:", error);
    return NextResponse.json(
      { errMsg: "Internal server error" },
      { status: 500 }
    );
  }
}
