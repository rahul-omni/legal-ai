import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  ErrorResponse,
  OrganizationSignupRequest,
  OrganizationSignupResponse,
} from "../types";

export default async function handler(
  data: OrganizationSignupRequest
): Promise<NextResponse<OrganizationSignupResponse | ErrorResponse>> {
  try {
    console.log("Received request for organization signup");

    const { orgName, adminName, email, password, roleId } = data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    console.log("Checked for existing user:", existingUser);

    if (existingUser) {
      console.warn("User already exists with email:", email);
      return NextResponse.json(
        { errMsg: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 8);
    console.log("Password hashed successfully");

    // Default to ADMIN role for organization signup if not specified
    const defaultRole = await db.role.findUnique({
      where: { name: "ADMIN" },
      select: { id: true },
    });
    console.log("Fetched default role:", defaultRole);

    if (!roleId && !defaultRole) {
      console.error("No default admin role configured");
      return NextResponse.json(
        { errMsg: "No default admin role configured" },
        { status: 400 }
      );
    }

    // Transaction for org and user creation
    console.log("Starting transaction for organization and user creation...");
    const result = await db.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: orgName, isVerified: false },
        select: {
          id: true,
          name: true,
          isVerified: true,
          plan: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      console.log("Organization created:", organization);

      const user = await tx.user.create({
        data: {
          name: adminName,
          email,
          password: hashedPassword,
          isIndividual: false,
          isVerified: false,
          organizationId: organization.id,
          roleId: roleId || defaultRole?.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          isVerified: true,
          isIndividual: true,
          organizationId: true,
          roleId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      console.log("User created:", user);

      return { user, organization };
    });
    console.log("Transaction completed successfully");

    return NextResponse.json(
      {
        errMsg: "Organization and admin user created successfully",
        user: result.user,
        organization: result.organization,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Organization signup error:", error);
    return NextResponse.json(
      { errMsg: "Internal server error" },
      { status: 500 }
    );
  } finally {
    console.log("Disconnecting from database...");
    await db.$disconnect();
    console.log("Database disconnected");
  }
}
