import { db } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";

function handleError(error: unknown, message: string, status = 500) {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const userDetails = await db.user.findUnique({
      where: { email },
    });

    if (!userDetails) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [result] = await db.$queryRawUnsafe<{ verify_password: boolean }[]>(
      `SELECT verify_password($1, $2)`,
      password,
      userDetails.password
    );

    if (!result?.verify_password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = `valid-token-${userDetails.id}`;

    // remove password from user object
    const { password: _, ...user } = userDetails;

    return NextResponse.json(
      { message: "Login success", user, token },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error, "Something went wrong.");
  }
}
