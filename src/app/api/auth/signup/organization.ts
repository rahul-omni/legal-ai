import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { OrganizationSignupSchema } from "../../lib/validation/auth";
import {
  ErrorResponse,
  OrganizationSignupRequest,
  OrganizationSignupResponse,
} from "../types";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest & { body: OrganizationSignupRequest },
  res: NextApiResponse<OrganizationSignupResponse | ErrorResponse>
) {
  try {
    const validation = OrganizationSignupSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.errors,
      });
    }

    const { orgName, adminName, email, password, roleId } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Default to ADMIN role for organization signup if not specified
    const defaultRole = await prisma.role.findUnique({
      where: { name: "ADMIN" },
      select: { id: true },
    });

    if (!roleId && !defaultRole) {
      return res
        .status(400)
        .json({ message: "No default admin role configured" });
    }

    // Transaction for org and user creation
    const result = await prisma.$transaction(async (tx) => {
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

      return { user, organization };
    });

    return res.status(201).json({
      message: "Organization and admin user created successfully",
      user: result.user,
      organization: result.organization,
    });
  } catch (error) {
    console.error("Organization signup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
}
