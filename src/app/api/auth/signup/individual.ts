import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextApiRequest, NextApiResponse } from "next";
import { IndividualSignupSchema } from "../../lib/validation/auth";
import {
  ErrorResponse,
  IndividualSignupRequest,
  IndividualSignupResponse,
} from "../types";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest & { body: IndividualSignupRequest },
  res: NextApiResponse<IndividualSignupResponse | ErrorResponse>
) {
  try {
    const validation = IndividualSignupSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.errors,
      });
    }

    const { name, email, password, roleId } = validation.data;

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

    // Default to ASSISTANT role if not specified
    const defaultRole = await prisma.role.findUnique({
      where: { name: "ASSISTANT" },
      select: { id: true },
    });

    if (!roleId && !defaultRole) {
      return res.status(400).json({ message: "No default role configured" });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isIndividual: true,
        isVerified: false,
        roleId: roleId || defaultRole?.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        isIndividual: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
}
