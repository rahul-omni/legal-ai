import { db } from "@/lib/db";
import { routeConfig } from "@/lib/routeConfig";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "../../../lib/logger";
import { redirectToURL } from "../../../lib/redirect";

export async function GET(req: NextRequest) {
  try {
    logger.info("Received GET request", { url: req.url });

    const { searchParams } = new URL(req.url);

    const token = searchParams.get("token");
    const email = searchParams.get("email");

    logger.debug("Extracted token", { token });

    if (!token) {
      logger.warn("Token is missing in the request");
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 }
      );
    }

    try {
      logger.debug("Debugging token", { token });
      const user = await db.user.findFirst({
        where: {
          verificationToken: token,
          verificationTokenExpiry: { gt: new Date() },
        },
      });

      // TODO - add auth token expiry flow

      logger.debug("Database query result for user", { user });
      if (!user) {
        logger.warn("Invalid or expired token");
        return NextResponse.json(
          { message: "Invalid or expired token" },
          { status: 400 }
        );
      }

      await db.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      });
    } catch (error) {
      logger.error("Error during database query", { error });
      throw error; // Re-throw the error to be handled by the outer catch block
    }

    logger.info("User verification status updated");

    cookies().set("verified", "true");
    logger.info("Verification cookie set");

    return redirectToURL(
      `${routeConfig.publicRoutes.verifyEmailSuccess}?email=${email}`
    );
  } catch (error) {
    logger.error("Error occurred during email verification", { error });
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
