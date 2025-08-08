import {
  ErrorAlreadyExists,
  ErrorApp,
  ErrorResponse,
  handleError,
} from "@/app/api/lib/errors";
import { db } from "@/app/api/lib/db";
import { RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "../../../lib/mail";
import {
  generateVerificationToken,
  getTokenExpiry,
} from "../../../helper/verificationTokens";
import {
  OrganizationSignupRequest,
  OrganizationSignupResponse,
} from "../types";


export default async function handler(
  data: OrganizationSignupRequest
): Promise<NextResponse<OrganizationSignupResponse | ErrorResponse>> {
  try {
    const { orgName, adminName, email, password } = data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ErrorAlreadyExists("User");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 8);

    const defaultRole = await db.role.findUnique({
      where: { name: RoleName.ADMIN },
      select: { id: true },
    });

    if (!defaultRole) {
      throw new ErrorApp("No default admin role configured");
    }

    const verificationToken = generateVerificationToken();
    const tokenExpiry = getTokenExpiry();

    const result = await db.$transaction(async (tx) => {
      // 1. Create user (same as individual)
      const user = await tx.user.create({
        data: {
          name: adminName,
          email,
          password: hashedPassword,
          verificationToken,
          verificationTokenExpiry: tokenExpiry,
          isVerified: false,
        },
      });

      // 2. Create organization-specific records
      const organization = await tx.organization.create({
        data: { name: orgName, isVerified: false, createdBy: user.id },
      });

      await tx.orgMembership.create({
        data: {
          userId: user.id,
          orgId: organization.id,
          roleId: defaultRole.id,
        },
      });

      // 3. Create default files (mirroring individual structure but org-specific)
      const [orgFolder, welcomeFile] = await Promise.all([
        // Folder (equivalent to "My Documents" in individual)
        tx.fileSystemNode.create({
          data: {
            name: "My Project",
            type: "FOLDER",
            userId: user.id,
            isExpanded: true,
          },
        }),

        // Root file (equivalent to "Welcome.docx" in individual)
        tx.fileSystemNode.create({
          data: {
            name: "Organization Welcome.docx",
            type: "FILE",
            content: "<div>Welcome to </div><div>This is your organization's workspace</div>",
            
            userId: user.id,
          },
        }),
      ]);

      // Nested file (equivalent to "Quick Start.docx" in individual)
      await tx.fileSystemNode.create({
        data: {
          name: "Team Onboarding.docx",
          type: "FILE",
          content:  "<div># Team Guide</div><div>Organization Project </div>"
        ,
          parentId: orgFolder.id,
          userId: user.id,
        },
      });

      return { user, organization };
    });

    await sendVerificationEmail(email, verificationToken);

    const { password: _, ...userDetails } = result.user;

    return NextResponse.json(
      {
        message: "Organization and admin user created successfully",
        user: userDetails,
        organization: result.organization,
        // Include default files info like individual version
         
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Organization signup error:", error);
    return handleError(error);
  }
} 