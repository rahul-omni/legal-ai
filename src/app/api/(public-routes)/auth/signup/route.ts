import {
  ErrorApp,
  ErrorResponse,
  handleError,
  ErrorValidation,
} from "@/app/api/lib/errors";
import { NextRequest, NextResponse } from "next/server";
import {
  IndividualSignupSchema,
  OrganizationSignupSchema,
} from "../../../lib/validation/auth";
import { SignupRequest, SignupResponse } from "../types";

const validationSchemas = {
  individual: IndividualSignupSchema,
  organization: OrganizationSignupSchema,
};

export async function POST(
  req: NextRequest
): Promise<NextResponse<SignupResponse | ErrorResponse>> {
  try {
    const { signupType, ...data } = (await req.json()) as SignupRequest;

    if (!signupType || !(signupType in validationSchemas)) {
      throw new ErrorValidation("Invalid or missing signup type");
    }

    const validation = validationSchemas[signupType].safeParse(data);
    if (!validation.success) {
      throw new ErrorValidation("Invalid request data");
    }

    try {
      const { default: signupHandler } = await import(`./${signupType}`);
      return signupHandler(validation.data);
    } catch (importError) {
      throw new ErrorApp("Failed to import signup handler");
    }
  } catch (error) {
    return handleError(error);
  }
}
