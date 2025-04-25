import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  ErrorResponse,
  IndividualSignupRequest,
  IndividualSignupResponse,
} from "../types";
import { db } from "@/lib/db";

export default async function handler(
  data: IndividualSignupRequest
): Promise<NextResponse<IndividualSignupResponse | ErrorResponse>> {
  try {
    const { name, email, password, roleId } = data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Default to ASSISTANT role if not specified
    const defaultRole = await db.role.findUnique({
      where: { name: "ASSISTANT" },
      select: { id: true },
    });

    if (!roleId && !defaultRole) {
      return NextResponse.json(
        { message: "No default role configured" },
        { status: 400 }
      );
    }

    // Create user
    const user = await db.user.create({
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

    return NextResponse.json(
      {
        user,
        message: "User created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}
